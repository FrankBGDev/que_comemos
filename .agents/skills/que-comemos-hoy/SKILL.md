---
name: que-comemos-hoy
description: Reglas de negocio y contratos de datos del proyecto "que comemos hoy" (planificador de comidas para familias bogotanas). Usa esta skill SIEMPRE que se edite backend/src/index.js (prompts de Gemini, REGIONES, DIETA_INSTRUCCIONES, PERFIL_OBJETIVO_INSTRUCCIONES) o el CATALOGO/DIETA_TAGS/REGIONES en src/App.jsx, o cuando el usuario pida agregar/editar platos, cambiar el prompt de sugerencias o recetas, ajustar el filtro de dieta o de alergias, agregar una región, o pregunte por qué una sugerencia no respeta una restricción alimentaria — incluso si no menciona estos nombres de archivo o función explícitamente (ej. "agrega un plato vegano", "por qué sigue sugiriendo algo con gluten", "cambia cómo decide qué tan sano fue lo último que comimos").
---

# Que comemos hoy — reglas de negocio y contratos de datos

Este proyecto genera sugerencias de comida y recetas vía Gemini (backend) con un catálogo
local de respaldo (frontend). Las dos mitades del sistema están duplicadas a propósito
(no comparten código), así que cualquier cambio en una regla de negocio casi siempre
necesita un cambio espejo en la otra. El riesgo más común al tocar este proyecto no es
escribir código que no compile, sino romper esa sincronía sin que ningún test lo note.

## Antes de tocar código, ubica en qué capa estás

| Si vas a... | El archivo es | La función/dato clave |
|---|---|---|
| Cambiar qué le pide el backend a Gemini | `backend/src/index.js` | `buildPrompt`, `buildRecetaPrompt`, `buildContextPrompt` |
| Agregar/editar un plato de respaldo | `src/App.jsx` | `CATALOGO[region][tiempo]` |
| Agregar una región nueva | **ambos archivos** | `REGIONES` (backend: objeto con `lugar`/`platos`; frontend: array de strings) |
| Cambiar una restricción de dieta o perfil | **ambos archivos** | backend: `DIETA_INSTRUCCIONES` / `PERFIL_OBJETIVO_INSTRUCCIONES`; frontend: `DIETA_TAGS` / `cumpleDieta` / `chocaConPerfil` |
| Cambiar el formato JSON de una respuesta | `backend/src/index.js` (genera) y cualquier código que lea `meals[tiempo]` o `.receta` en `App.jsx` (consume) | ver `references/api-contracts.md` |

Lee `references/business-rules.md` antes de modificar cualquier lógica de dieta, perfil,
región o catálogo — documenta el comportamiento exacto de cada función, incluyendo dos
asimetrías fáciles de pasar por alto (detalladas ahí): el filtro de **dieta** se
reincorpora si vacía la lista de candidatos, pero el de **alergias** nunca lo hace.

Lee `references/api-contracts.md` antes de cambiar cualquier estructura JSON que viaja
entre backend y frontend, o antes de escribir/editar un prompt de Gemini — ahí está el
esquema exacto que Gemini debe devolver para cada endpoint.

## Reglas que aplican siempre, sin importar qué estés cambiando

- **Geografía y tienda real:** los ingredientes deben poder comprarse en D1, Éxito o
  una tienda de barrio bogotana/colombiana típica. Nada de ingredientes de importación
  difícil de conseguir, aunque el plato sea válido en otra cocina.
- **Tono "zona azul" sin perder identidad local:** cuando un cambio de prompt toque el
  encabezado de contexto (`buildContextPrompt`), conserva la inclinación hacia más
  vegetales/leguminosas y porciones moderadas — es una directriz de salud a largo plazo
  del proyecto, no decoración. No la elimines para "simplificar" un prompt.
  Ver [[project_roadmap_health_tracking]] en memoria si necesitas el contexto completo
  de hacia dónde va esto.
- **Las alergias son un límite de seguridad, no una preferencia.** Si estás escribiendo
  lógica de filtrado (catálogo o prompt), nunca apliques el patrón "si el filtro vacía
  la lista, ignóralo" a una alergia. Ese patrón sí es correcto para dieta o gustos.
- **Sincronía de listas literales:** `REGIONES` y las etiquetas de dieta deben tener
  exactamente las mismas claves en backend y frontend (ver tabla de arriba). Si agregas
  una región o una dieta en un archivo y no en el otro, el filtro correspondiente
  simplemente no hará nada en el lado que olvidaste — no hay error visible, así que
  verifica ambos archivos manualmente después de cualquier cambio.
- **JSON estricto:** cualquier prompt de Gemini debe seguir pidiendo "ÚNICAMENTE JSON
  válido, sin texto extra, sin markdown" con la estructura exacta documentada en
  `references/api-contracts.md`. Si agregas un campo nuevo al JSON esperado, actualízalo
  ahí también y en el ejemplo dentro del prompt — Gemini sigue el ejemplo más que la
  descripción en prosa.

## Al agregar o editar un plato en `CATALOGO`

1. Confirma la región (una de las 7 en `REGIONES`) y el tiempo (`desayuno`/`almuerzo`/`cena`).
2. Asigna `dieta: []` con los tags que correspondan de `DIETA_TAGS`
   (`vegetariano`, `vegano`, `sinGluten`, `sinLacteos`) — un plato vegano lleva
   **ambos** `vegetariano` y `vegano`.
3. Antes de guardar, verifica que la combinación región×tiempo×dieta no quede sin
   ningún plato que la cumpla. No hay fallback más allá de "usar la lista sin filtrar
   por dieta" — si una combinación queda en cero platos, un usuario con esa dieta en esa
   región recibirá un plato que no respeta su restricción. Si tienes Bash disponible, un
   script rápido que recorra `CATALOGO` y cuente combinaciones vacías es más confiable
   que revisarlo a ojo.

## Al modificar un prompt de Gemini (`buildPrompt` / `buildRecetaPrompt`)

1. No rompas la composición existente: ambos prompts empiezan con
   `buildContextPrompt(region)` y luego agregan secciones condicionales
   (`dietaTexto`, `perfilTexto`, `historialTexto`, `balanceTexto`, `alergiaTexto`).
   Si agregas una instrucción nueva, sigue el mismo patrón — una variable de texto que
   se concatena solo si aplica, en vez de un `if` que reescriba todo el prompt.
   `thinkingConfig: { thinkingBudget: 0 }` en `callGemini` es deliberado: sin eso, el
   modelo gasta el budget de salida "pensando" y trunca el JSON — no lo quites al tocar
   `callGemini`.
2. Si la instrucción nueva depende de un dato que no le llega al backend todavía
   (ej. algo que solo vive en `contexto` o `perfil` en el frontend), tendrás que agregarlo
   también al body de la petición `fetch` en `App.jsx` y al desestructurado
   `req.body` del endpoint correspondiente.
3. Después de cambiar un prompt, vuelve a leer el ejemplo de JSON dentro del string del
   prompt — es lo que Gemini copia más fielmente. Una instrucción en prosa que contradice
   el ejemplo casi siempre pierde.

## Casos típicos donde el usuario reporta "no está respetando X"

Antes de asumir que es un bug del modelo, revisa en este orden (suele ser uno de estos,
documentado con más detalle en `references/business-rules.md`):

1. ¿La sugerencia vino de Gemini o del catálogo local (`fallback: true` / `_local: true`)?
   Cada camino tiene su propia lógica de filtrado — un fix en el prompt no arregla el
   catálogo, y viceversa.
2. Si es alergia/`noQuieren` y vino del catálogo: ¿`chocaConPerfil` está comparando contra
   `plato.ingredientes` Y `plato.nombre`? Revisa que el término de búsqueda tenga ≥3
   caracteres (los más cortos se ignoran a propósito para evitar falsos positivos).
3. Si es dieta y vino del catálogo: recuerda que el filtro de dieta SÍ se reincorpora
   (silenciosamente) cuando vacía la lista — eso puede explicar por qué "a veces sí
   funciona y a veces no" para la misma región.
4. Si vino de Gemini: ¿la instrucción de esa restricción está en `DIETA_INSTRUCCIONES`/
   `buildPerfilTexto` y se está concatenando en `buildPrompt`/`buildRecetaPrompt`, o se
   quedó solo declarada sin usarse?
