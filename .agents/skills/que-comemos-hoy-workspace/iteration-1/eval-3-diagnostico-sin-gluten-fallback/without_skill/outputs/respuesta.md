# Diagnóstico: dieta "Sin gluten" + región "Eje Cafetero" en modo sin conexión

## Respuesta corta

No, **no es un bug en el filtro de dieta**. Revisé el código real (`CATALOGO`, `cumpleDieta`, `pickFromCatalogo` en `src/App.jsx`) y la lógica de "Sin gluten" está bien implementada y se aplica correctamente. Lo que describes parece venir de dos cosas distintas, ninguna de las cuales es un fallo del filtro:

1. El catálogo de Eje Cafetero **no tiene ninguna "arepa de maíz pelao"** — ese plato específico solo existe en la región **Santander**. Es posible que estés viendo nombres de platos de otra región o confundiendo el nombre con "Arepa valluna" (la arepa de desayuno que sí existe en Eje Cafetero).
2. El plato con harina de trigo que ves ("Aborrajados de plátano maduro") **sí está correctamente excluido** por el filtro cuando seleccionas "Sin gluten" — ver detalle abajo. Si te apareció con esa dieta activa, lo más probable es que la dieta no estuviera realmente en "Sin gluten" en ese momento (por ejemplo, si cambiaste la opción después de que ya se había generado el plan, o si el storage guardó un contexto de un día anterior con otra dieta).

## Cómo funciona el filtro (verificado en el código)

```js
const DIETA_TAGS = {
  "Vegetariano": "vegetariano",
  "Vegano": "vegano",
  "Sin gluten": "sinGluten",
  "Sin lácteos": "sinLacteos",
};

function cumpleDieta(plato, dietaLabel) {
  const tag = DIETA_TAGS[dietaLabel];
  if (!tag) return true;
  return !!plato.dieta?.includes(tag);
}
```

Cada plato en `CATALOGO` lleva un array `dieta: [...]` con los tags que cumple. `cumpleDieta` simplemente comprueba si el tag de "Sin gluten" (`sinGluten`) está en ese array. No hay lógica de excepción ni de "casi cumple" — es una pertenencia binaria al array.

`pickFromCatalogo` (la función que se usa en modo sin conexión / fallback) hace:

```js
const platosRegion = CATALOGO[region] || CATALOGO["Bogotá"];
const todos = (platosRegion[tiempo] || []).filter(d => !chocaConPerfil(d, perfil));
const aptos = todos.filter(d => cumpleDieta(d, dieta));
const lista = aptos.length ? aptos : todos;   // <-- solo cae al set sin filtrar si "aptos" queda vacío
...
```

Esto es importante: si `aptos` (los platos que sí cumplen "Sin gluten") tiene al menos un elemento, **nunca** se usa el set sin filtrar. Solo se "reintroducen" platos que no cumplen la dieta como red de seguridad si el filtro deja la lista en cero — y ese no es el caso aquí.

## Los tres platos de desayuno en Eje Cafetero, etiquetados

```js
"Eje Cafetero": {
  desayuno: [
    { nombre: "Arepa valluna con aguacate", ..., dieta: ["vegetariano", "vegano", "sinGluten", "sinLacteos"] },
    { nombre: "Aborrajados de plátano maduro", ingredientes: [..., "Harina de trigo", ...], dieta: ["vegetariano", "sinLacteos"] },   // <-- NO tiene "sinGluten"
    { nombre: "Pandebono cafetero con chocolate", ..., dieta: ["vegetariano"] },                                                       // <-- NO tiene "sinGluten"
  ],
  ...
```

Con dieta = "Sin gluten", `aptos` para el desayuno de Eje Cafetero queda como **un solo plato: "Arepa valluna con aguacate"**. Los "Aborrajados" (que sí contienen harina de trigo en sus ingredientes) están correctamente excluidos porque su array `dieta` no incluye `"sinGluten"` — el etiquetado coincide con la receta real, no hay contradicción ahí.

Repetí la búsqueda de "Harina de trigo" / "Pan" en *todo* el catálogo (las 7 regiones): en ningún caso un plato con harina de trigo en sus ingredientes tiene el tag `sinGluten`. Así que no encontré ningún plato mal etiquetado que explique que te salga algo con trigo mientras la dieta está realmente fijada en "Sin gluten".

## Qué sí puede estar pasando

Dado que el código de filtrado no tiene el bug, las explicaciones más probables del comportamiento que ves son:

- **Desfase de contexto al momento del fallo de red.** `generateMeal(tiempo, ctx)` recibe el `contexto` actual (incluye `dieta` y `region`) en el momento en que se llama, y si Gemini falla, el `catch` llama a `pickFromCatalogo(tiempo, historial, ctx?.dieta, ctx?.region, perfil)` con ese mismo `ctx`. Si cambiaste la dieta en el panel de configuración *después* de que ya estaba en curso una generación, esa llamada en vuelo sigue usando la dieta con la que se inició, no la nueva. Esto no es un bug de `cumpleDieta`, es una condición de carrera de UI: cambiar la dieta mientras "Planear todo el día" está en proceso puede hacer que el resultado (incluido el fallback) refleje la dieta anterior.
- **Plan del día restaurado de localStorage.** El plan (`qch:plan`) se restaura completo si la fecha coincide con hoy, incluido `contexto`. Si ayer dejaste la dieta en "De todo" y hoy abres la app, verías el plan de ayer (con su dieta) hasta que generes uno nuevo explícitamente.
- **Confusión de nombres entre regiones.** Como mencioné arriba, la "arepa de maíz pelao" no es un plato de Eje Cafetero en este catálogo — es de Santander. Vale la pena confirmar en qué región estaba realmente activo el selector cuando viste ese plato.

## Conclusión

El filtro de dieta (`cumpleDieta`/`pickFromCatalogo`) es correcto y consistente para Eje Cafetero + "Sin gluten": solo "Arepa valluna con aguacate" pasa el filtro de desayuno, y ningún plato con harina de trigo tiene el tag `sinGluten` en ninguna región del catálogo. Si efectivamente ves un plato con harina de trigo mientras la dieta dice "Sin gluten", sería útil reproducirlo anotando: (1) si cambiaste la dieta justo antes/durante la generación, y (2) si el plan venía restaurado de un día anterior. Eso apuntaría a un problema de sincronización de estado en la UI, no del filtro de dieta en sí.
