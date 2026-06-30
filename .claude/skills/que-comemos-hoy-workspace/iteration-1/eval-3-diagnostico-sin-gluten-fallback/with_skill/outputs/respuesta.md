# Diagnóstico: "Sin gluten" + Eje Cafetero + modo sin conexión

## Respuesta corta

No, no es un bug del catálogo local para Eje Cafetero. Revisé plato por plato los 9 platos
de esa región (`CATALOGO["Eje Cafetero"]` en `src/App.jsx`, líneas 175-191) y **los tres
tiempos (desayuno, almuerzo, cena) tienen al menos un plato con el tag `sinGluten`**:

- **Desayuno:** "Arepa valluna con aguacate" → `dieta: ["vegetariano","vegano","sinGluten","sinLacteos"]`
- **Almuerzo:** "Sancocho valluno", "Fríjoles con garra cafeteros", "Fríjoles cafeteros con arroz y aguacate" → los 3 llevan `sinGluten`
- **Cena:** "Tamal vallecaucano", "Arepa valluna con hogao y queso", "Sopa de plátano cafetera" → los 3 llevan `sinGluten`

El plato con harina de trigo que mencionas — **"Aborrajados de plátano maduro"**
(ingredientes: `["Plátano maduro", "Harina de trigo", "Huevo", "Aceite", "Azúcar"]`,
línea 178) — está etiquetado correctamente como `dieta: ["vegetariano", "sinLacteos"]`,
**sin** `sinGluten`. Por construcción del filtro, ese plato nunca debería poder salir
cuando tu dieta es "Sin gluten" *si la sugerencia viene del catálogo local sin conexión*.

## Por qué funciona así (la lógica exacta)

`pickFromCatalogo()` (línea 216 de `src/App.jsx`) hace esto, en orden:

```js
const todos = (platosRegion[tiempo] || []).filter(d => !chocaConPerfil(d, perfil));
const aptos = todos.filter(d => cumpleDieta(d, dieta));
const lista = aptos.length ? aptos : todos;   // ← la asimetría clave
```

Hay una regla de negocio documentada (`references/business-rules.md` de la skill del
proyecto): **si el filtro de dieta deja la lista en cero, el código lo ignora y usa la
lista completa sin filtrar** (`aptos.length ? aptos : todos`). Esto es intencional —
mejor mostrar algún plato que ninguno cuando la dieta es una preferencia, no una alergia.
Esa es la "asimetría" que probablemente esperabas que explicara tu caso ("a veces sí, a
veces no" suena exactamente a ese patrón). **Pero no aplica aquí**, porque verifiqué que
para Eje Cafetero, en ninguno de los 3 tiempos `aptos` queda vacío con "Sin gluten" —
siempre hay cobertura. Por lo tanto el aborrajado nunca debería colarse por esta vía.

## Entonces, ¿de dónde sale el aborrajado con harina de trigo?

Hay dos explicaciones reales, ambas verificables en tu uso de la app:

1. **No estabas realmente en modo catálogo local cuando viste el aborrajado.**
   El filtro `cumpleDieta`/cero-fallback solo aplica cuando la tarjeta de la comida
   muestra el banner "⚠ Sugerencia sin conexión" (`meal.fallback === true`, ver línea
   532-536 de `App.jsx`). Si Gemini sí respondió (aunque la conexión sea mala/intermitente,
   no estrictamente "caída"), la sugerencia viene del backend, no del catálogo, y ahí la
   restricción de dieta depende de `DIETA_INSTRUCCIONES` en `backend/src/index.js`
   (una instrucción en prosa dentro del prompt) — Gemini puede ignorarla ocasionalmente
   porque no hay validación de esquema ni un filtro duro del lado del backend, a diferencia
   del catálogo que sí filtra por tag programáticamente. Esto explicaría perfectamente el
   patrón "a veces sí, a veces no" sin que sea el catálogo local el responsable.

2. **Vale la pena confirmar que de verdad viste el aborrajado SIN el banner de "sin
   conexión".** Si la tarjeta no mostraba "⚠ Sugerencia sin conexión, Reintentar", la
   sugerencia no pasó por `pickFromCatalogo` y el bug (si lo hay) está en el lado de
   Gemini/prompt, no en el catálogo.

## Cómo confirmarlo en tu próxima prueba

La próxima vez que te pase, fíjate específicamente si la tarjeta tiene el banner naranja/rojo
de "Sugerencia sin conexión" con botón "Reintentar":

- **Si el banner SÍ aparece** y el plato tiene harina de trigo en Eje Cafetero, eso sí sería
  un bug nuevo que no coincide con lo que dice el código — avísame y lo reviso de nuevo línea
  por línea (podría ser un problema de caché del navegador con una versión vieja del bundle).
- **Si el banner NO aparece**, la sugerencia vino de Gemini, y el problema está en que
  `DIETA_INSTRUCCIONES["Sin gluten"]` es una instrucción de prompt, no un filtro duro — Gemini
  ocasionalmente no la respeta. Eso sería un fix distinto (reforzar el prompt o agregar
  post-validación en el backend), no un fix al catálogo.

## Resumen

El catálogo local de Eje Cafetero está bien construido para "Sin gluten": los 9 platos
de esa región fueron revisados y los 3 tiempos tienen cobertura completa (al menos un
plato `sinGluten` cada uno), así que la asimetría de "el filtro de dieta se reincorpora
si vacía la lista" — que sí es real en el código y sí puede causar inconsistencias en
*otras* combinaciones región×dieta sin cobertura — no es la causa aquí. La arepa de maíz
pelao que sí te llega bien es la esperada (varios platos de la región la usan y están bien
etiquetados). El sospechoso real del aborrajado con trigo es que esa sugerencia probablemente
no vino del catálogo de respaldo sino de Gemini, donde la restricción de dieta es una
instrucción de prompt y no una regla dura.
