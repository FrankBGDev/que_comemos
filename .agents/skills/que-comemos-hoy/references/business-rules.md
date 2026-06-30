# Reglas de negocio detalladas

## Regiones

`REGIONES` debe tener las mismas 7 claves en ambos archivos:
`Bogotá, Tolima, Antioquia, Costa Atlántica, Costa Pacífica, Santander, Eje Cafetero`.

- Backend (`backend/src/index.js`): objeto `{ [region]: { lugar, platos } }`, usado por
  `buildContextPrompt(region)` para generar dinámicamente el encabezado de cada prompt
  de Gemini. Una región desconocida cae a `"Bogotá"`.
- Frontend (`src/App.jsx`): array plano de strings, usado para poblar el selector de
  región y como primera clave de `CATALOGO[region][tiempo]`. Una región desconocida
  también cae a `"Bogotá"`.

Agregar una región implica: una entrada nueva en ambos `REGIONES`, y en el frontend,
una entrada `CATALOGO[nuevaRegion]` con al menos un plato por cada `tiempo` (desayuno,
almuerzo, cena) que cubra, idealmente, cada combinación de dieta.

## Dieta

Etiquetas que ve el usuario (`PREGUNTAS_CONTEXTO`, id `dieta`, en `App.jsx`):
`"De todo", "Vegetariano", "Vegano", "Sin gluten", "Sin lácteos"`.

- `"De todo"` (o cualquier valor no reconocido) nunca filtra nada, ni en backend ni en
  frontend — es el caso "sin restricción".
- Frontend: `DIETA_TAGS` mapea cada etiqueta (excepto "De todo") a un tag interno:
  `Vegetariano→vegetariano, Vegano→vegano, Sin gluten→sinGluten, Sin lácteos→sinLacteos`.
  Cada plato de `CATALOGO` lleva `dieta: string[]` con los tags que cumple — un plato
  vegano lleva `["vegetariano", "vegano"]` porque vegano implica vegetariano.
  `cumpleDieta(plato, dietaLabel)` resuelve la etiqueta a tag vía `DIETA_TAGS` y revisa
  `plato.dieta.includes(tag)`.
- Backend: `DIETA_INSTRUCCIONES` mapea la misma etiqueta a una frase que se concatena
  en `buildPrompt`. Las etiquetas (las *keys* del objeto) deben ser idénticas, carácter
  por carácter, a las que ofrece la UI — un typo aquí significa que esa dieta deja de
  aplicarse silenciosamente para Gemini, sin ningún error.

**Asimetría importante — fallback de dieta:** en `pickFromCatalogo`, si filtrar por
dieta deja la lista de platos candidatos en cero, el código *ignora el filtro* y usa la
lista completa (`lista = aptos.length ? aptos : todos`). Esto es intencional: es mejor
mostrar *algún* plato que ninguno cuando la dieta es una preferencia. Pero significa que
toda combinación región×tiempo×dieta sin cobertura real producirá, ocasionalmente,
sugerencias que no respetan la dieta — sin lanzar ningún error. Por eso el SKILL.md pide
verificar cobertura antes de guardar un plato nuevo.

## Perfil familiar (alergias, composición, objetivo, "no quieren")

Se llena una sola vez (`PerfilScreen`), no por día como `contexto`. Tiene 4 campos
relevantes a la lógica de negocio:

- **`alergias`** (texto libre): la única restricción **dura**. Tratada como seguridad,
  no preferencia, en ambos lados:
  - Backend: `buildPerfilTexto` inyecta una frase "RESTRICCIÓN DE SALUD (obligatoria)"
    tanto en `buildPrompt` como en `buildRecetaPrompt` (vía `alergiaTexto` en este último).
  - Frontend: `chocaConPerfil(plato, perfil)` excluye el plato del pool *antes* de
    aplicar el filtro de dieta, usando texto normalizado (minúsculas, sin tildes vía
    NFD) contra `plato.nombre + " " + plato.ingredientes.join(" ")`. Términos de menos
    de 3 caracteres se ignoran (evita falsos positivos con palabras muy cortas).
  - **A diferencia de la dieta, este filtro nunca se reincorpora si vacía la lista.**
    Es la asimetría inversa a la de dieta — aquí preferimos no mostrar nada antes que
    arriesgar una alergia. Si vacía completamente el pool de un tiempo/región, el
    resultado es `null` y la UI lo maneja como "sin sugerencia disponible", no como un
    plato que ignora la alergia.
- **`composicion`** (`"Niños pequeños" | "Adultos mayores" | "Ambos" | "Ninguno"`):
  solo backend, vía `buildPerfilTexto` — ajusta el tono (evitar picante con niños,
  preparaciones blandas con adultos mayores). No filtra el catálogo local.
- **`objetivo`** (`"Comer más sano" | "Ahorrar al máximo" | "Variar y no aburrirse" |
  "Un poco de todo"`): solo backend, vía `PERFIL_OBJETIVO_INSTRUCCIONES`. `"Un poco de
  todo"` no agrega nada (caso neutro, igual que `"De todo"` en dieta).
- **`noQuieren`** (texto libre, platos que no quieren volver a ver): mismo trato que
  alergias en ambos lados — dura en backend (`buildPerfilTexto`), y entra también en
  `chocaConPerfil` en frontend junto con `alergias`.

## Historial y balance de salud

`historial` (máx. 21 entradas, ~7 días) se manda en cada request. `buildPrompt` revisa
solo las últimas 6 (~2 días): si la mayoría están marcadas `saludable: false`, agrega una
instrucción para compensar con algo más liviano. Esto es puramente del lado backend —
`pickFromCatalogo` solo usa `historial` para evitar repetir nombres recientes, no para
ajustar qué tan "sano" es el plato elegido.

## Origen de una sugerencia: Gemini vs. catálogo local

Toda sugerencia/receta tiene una marca de origen que determina qué lógica de filtrado
aplicó:
- Si viene de Gemini: ninguna marca especial; siguió las instrucciones del prompt.
- Si viene del catálogo (`pickFromCatalogo`): `{ ...plato, _local: true }`. Si además
  reemplazó una llamada a Gemini que falló: `{ ...meal, fallback: true }` (la UI muestra
  el banner "sin conexión").

Diagnosticar "por qué esta sugerencia no respeta X" siempre empieza por identificar cuál
de los dos caminos generó esa sugerencia en particular — son dos implementaciones
independientes de las mismas reglas de negocio.
