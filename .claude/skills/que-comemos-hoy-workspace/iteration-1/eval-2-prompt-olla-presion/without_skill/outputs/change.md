# Cambio: evitar olla a presión en la receta completa generada por Gemini

Archivo: `backend/src/index.js`
Función: `buildRecetaPrompt`

## Diff

```diff
diff --git a/backend/src/index.js b/backend/src/index.js
index a60d134..da2e669 100644
--- a/backend/src/index.js
+++ b/backend/src/index.js
@@ -79,6 +79,7 @@ function buildRecetaPrompt({ nombre, personas, region, perfil }) {
   return `${buildContextPrompt(region)}
 
 Genera la receta COMPLETA y detallada de "${nombre}" para ${personas}.${alergiaTexto}
+RESTRICCIÓN DE UTENSILIOS (obligatoria): la familia NO tiene olla a presión (olla express/pressure cooker) en casa. No la incluyas en "utensilios" ni la menciones en ningún paso; usa siempre una alternativa con ollas, sartenes u otros utensilios convencionales (por ejemplo, olla normal a fuego lento o tapada, ajustando el tiempo de cocción si es necesario).
 Responde ÚNICAMENTE con un JSON válido (sin texto extra, sin markdown) con esta estructura exacta:
 {
   "tiempo_total": 30,
```

## Justificación

`buildRecetaPrompt` construye el prompt que el backend envía a Gemini para generar la receta completa (`/api/receta-completa`). Antes no había ninguna instrucción sobre utensilios, así que Gemini podía sugerir libremente una olla a presión (olla express) en `utensilios` o dentro de los `pasos`. Se agregó una línea de restricción obligatoria, siguiendo el mismo patrón ya usado para alergias (`alergiaTexto`) y dieta (`DIETA_INSTRUCCIONES`): instrucción explícita en español, marcada como obligatoria, indicando que se debe usar una alternativa convencional (olla normal, sartén, etc.) ajustando tiempos de cocción si aplica.

No se modificó `buildPrompt` (prompt de sugerencia de comida) porque ese endpoint no genera la lista de utensilios — solo `buildRecetaPrompt` (receta completa) lo hace.
