# Contratos de API y esquemas JSON

Ambos endpoints reciben `POST`, devuelven JSON parseado tal cual lo generó Gemini (no
hay validación de esquema en el backend más allá de que el `JSON.parse` no truene), y
caen a `502` si Gemini falla o devuelve algo no parseable, o `500` si falta
`GEMINI_API_KEY` o hay un error inesperado.

## `POST /api/sugerir-comida`

**Request body:**
```json
{
  "tiempo": "desayuno" | "almuerzo" | "cena",
  "contexto": { "personas": string, "tiempo": string, "mercado": string, "region": string, "dieta": string },
  "historial": [{ "nombre": string, "tiempo": string, "fecha": string, "saludable": boolean }],
  "dia": string,
  "perfil": { "alergias": string, "composicion": string, "objetivo": string, "noQuieren": string } | null
}
```
`tiempo` y `contexto` son obligatorios (400 si faltan). `tiempo` debe ser uno de los 3
valores válidos (400 si no).

**Response body** (lo que Gemini debe devolver, definido en el prompt de `buildPrompt`):
```json
{
  "nombre": string,
  "descripcion": string,
  "ingredientes": string[],
  "saludable": boolean,
  "economico": boolean,
  "rapido": boolean,
  "tip": string
}
```

## `POST /api/receta-completa`

**Request body:**
```json
{
  "nombre": string,
  "personas": string,
  "region": string,
  "perfil": { "alergias": string, ... } | null
}
```
`nombre` y `personas` son obligatorios (400 si faltan). `region` y `perfil` son
opcionales — si faltan, `buildContextPrompt` cae a Bogotá y no se agrega texto de
alergias.

**Response body** (definido en el prompt de `buildRecetaPrompt`, cacheado en
`meals[tiempo].receta` en el frontend):
```json
{
  "tiempo_total": number,
  "porciones": string,
  "dificultad": string,
  "ingredientes": [{ "nombre": string, "cantidad": string, "unidad": string }],
  "utensilios": string[],
  "pasos": [{ "descripcion": string, "tiempo_minutos": number, "tip": string }],
  "valor_nutricional": { "Calorías": string, "Proteína": string, "Carbohidratos": string, "Grasas": string }
}
```
**Regla de negocio:** `pasos` debe tener máximo 6 elementos — el prompt instruye a Gemini
explícitamente a agrupar sub-pasos en vez de superar ese límite. Si modificas este
prompt, conserva esa instrucción o decide explícitamente con el usuario si se relaja.

## `GET /health`

Sin lógica de negocio, devuelve `{ "status": "ok" }`. Útil solo para checks de
disponibilidad (ej. Render).

## Notas para quien escriba o edite estos JSON

- Gemini sigue el **ejemplo literal** dentro del prompt más fielmente que cualquier
  descripción en prosa alrededor de él — si cambias un campo, cambia el ejemplo, no solo
  el texto explicativo.
- `responseMimeType: "application/json"` + `thinkingConfig: { thinkingBudget: 0 }` están
  configurados en `callGemini` para forzar JSON puro y evitar que el "pensamiento" interno
  consuma el budget de salida y trunque la respuesta. No son opcionales si agregas un
  tercer endpoint que llame a `callGemini`.
- El frontend nunca valida estos esquemas contra un schema formal (no hay Zod/Ajv) — un
  campo faltante o mal tipado se manifiesta como un `undefined` silencioso en el render,
  no como un error explícito. Si agregas un campo nuevo al JSON esperado, búscalo también
  en el lado del frontend que lo consume (`MealCard`, `RecipeModal`) para confirmar que
  ya sabe leerlo.
