# Cambio: evitar olla a presión en `buildRecetaPrompt`

## Diff exacto (`backend/src/index.js`)

```diff
diff --git a/backend/src/index.js b/backend/src/index.js
index a60d134..670ea61 100644
--- a/backend/src/index.js
+++ b/backend/src/index.js
@@ -76,9 +76,11 @@ function buildRecetaPrompt({ nombre, personas, region, perfil }) {
     ? `\nRESTRICCIÓN DE SALUD (obligatoria): evita por completo estos ingredientes en la receta y en cualquier variación que sugieras: ${perfil.alergias.trim()}.`
     : "";
 
+  const utensiliosTexto = `\nRESTRICCIÓN DE UTENSILIOS (obligatoria): no asumas que la familia tiene olla a presión (olla exprés). No la menciones en "utensilios" ni la uses como paso obligatorio en "pasos"; usa siempre una alternativa con olla normal, sartén o similar, ajustando el tiempo de cocción si es necesario.`;
+
   return `${buildContextPrompt(region)}
 
-Genera la receta COMPLETA y detallada de "${nombre}" para ${personas}.${alergiaTexto}
+Genera la receta COMPLETA y detallada de "${nombre}" para ${personas}.${alergiaTexto}${utensiliosTexto}
 Responde ÚNICAMENTE con un JSON válido (sin texto extra, sin markdown) con esta estructura exacta:
 {
   "tiempo_total": 30,
```

## Reglas de la skill que seguí

- **Patrón de texto condicional concatenado:** seguí el mismo patrón que `alergiaTexto`
  (variable de texto que se concatena al string del prompt) en vez de meter un `if` que
  reescribiera todo `buildRecetaPrompt`. La sección "Al modificar un prompt de Gemini" del
  `SKILL.md` pide explícitamente seguir este patrón al agregar una instrucción nueva.
- **No rompí el ejemplo de JSON ni la instrucción de pasos:** la inserción ocurre antes de
  la línea `Responde ÚNICAMENTE con un JSON válido...`; el bloque de ejemplo JSON
  (`utensilios`, `pasos`, etc.) y la frase final sobre `tiempo_minutos` quedaron intactos.
  `api-contracts.md` advierte que Gemini sigue el ejemplo literal más que la prosa, así
  que no toqué la estructura del ejemplo, solo agregué una restricción en prosa.
- **No toqué `thinkingConfig`:** la edición fue puramente dentro de `buildRecetaPrompt`;
  `callGemini` y su `thinkingConfig: { thinkingBudget: 0 }` no se modificaron.
