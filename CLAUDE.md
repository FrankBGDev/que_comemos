# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run lint     # ESLint check (no auto-fix; fix manually)
```

No test framework is configured.

The `backend/` folder is a separate Express proxy (its own `package.json`) — see `backend/README.md` for its commands (`npm run dev` / `npm start` inside `backend/`).

## Architecture

Single-component React app. All logic, state, and styles live in `src/App.jsx`. There is no routing and no external state library. AI calls go through the Express proxy in `backend/` rather than from the browser.

**Component tree:**
```
BogotaMealPlanner  ← root, owns all state
├── MealCard       ← rendered 3×: desayuno, almuerzo, cena
│   └── MealCardSkeleton  ← shown while loading before first result
└── RecipeModal    ← bottom sheet, lazy-loads full recipe on demand
    └── RecipeSkeleton
```

**State shape:**
```js
contexto:      { personas, tiempo, mercado, region, dieta }  // user config selections; region: one of REGIONES (default "Bogotá"); dieta: "De todo" | "Vegetariano" | "Vegano" | "Sin gluten" | "Sin lácteos"
meals:         { desayuno, almuerzo, cena }   // null | meal object (may include .receta and .fallback flags)
loading:       { desayuno, almuerzo, cena }   // per-meal loading flags
loadingAll:    bool                           // "plan full day" in progress
loadingReceta: bool                           // recipe fetch in progress
showConfig:    bool
dia:           string                         // Spanish day name, set on mount
historial:     { nombre, tiempo, fecha, saludable }[]  // last 21 meals (~7 days), sent to backend to avoid repeats and balance nutrition
modalTiempo:   string | null                  // which meal's recipe modal is open
```

**Data flow:**
1. User picks `contexto` options → clicks "Planear todo el día"
2. `generateAll()` calls `generateMeal(tiempo)` for all three meals in parallel via `Promise.all`
3. `generateMeal()` sends `{ tiempo, contexto, historial, dia }` → `fetch` to the backend proxy (`${VITE_API_URL}/api/sugerir-comida`), which builds the prompt and calls Gemini
4. Backend returns the parsed meal JSON directly → stored in `meals[tiempo]`
5. "Otra opción ↻" triggers `generateMeal()` for a single meal slot
6. "Ver receta" opens `RecipeModal`; the modal calls `loadReceta(tiempo)` → `fetch` to `${VITE_API_URL}/api/receta-completa`. The full recipe is cached into `meals[tiempo].receta` — subsequent opens skip the fetch.
7. If Gemini fails, `generateMeal()` falls back to `pickFromCatalogo()` (the local `CATALOGO` object in `App.jsx`). Fallback meals get `{ ...meal, fallback: true }`, which renders a "sin conexión" banner with a retry button.

**Dietary filter (`contexto.dieta`):** Each dish in `CATALOGO` carries a `dieta: string[]` tag from `{"vegetariano", "vegano", "sinGluten", "sinLacteos"}` (vegan dishes are tagged with both `vegetariano` and `vegano`). `cumpleDieta(plato, dietaLabel)` checks a dish against the selected label via the `DIETA_TAGS` map; `"De todo"` or an unrecognized label always passes. `pickFromCatalogo()` filters by this before picking, falling back to the full unfiltered list only if no dish in that meal slot matches (shouldn't happen given current catalog coverage — kept as a safety net, never silently ignore a real dietary restriction without checking coverage first). On the backend, `buildPrompt()` looks up `contexto.dieta` in `DIETA_INSTRUCCIONES` (in `backend/src/index.js`) and appends an explicit restriction line to the Gemini prompt; the same labels must stay in sync between both files.

**Regional cuisine (`contexto.region`):** `CATALOGO` is keyed by region first, then by `tiempo` — `CATALOGO[region][tiempo]`, e.g. `CATALOGO["Antioquia"].almuerzo`. `REGIONES` (the array of selectable region names) and `pickFromCatalogo()` both live in `App.jsx`; an unknown region falls back to `"Bogotá"`. Every region × meal × diet combination must have at least one matching dish — there's no further fallback once region+diet filtering empties the list, so check coverage before trimming or re-tagging dishes (verified empirically when this was built; re-verify with a throwaway script if the catalog changes). On the backend, `buildContextPrompt(region)` (in `backend/src/index.js`) looks up the region in its own `REGIONES` map (place names + típicos) and generates the system prompt dynamically instead of a single hardcoded Bogotá-only `CONTEXT_PROMPT` — the region keys in both files' `REGIONES` must stay in sync. `region` is also forwarded to `/api/receta-completa` so the full recipe prompt matches the region the dish was suggested for.

**Stale-request cancellation:** `generateMeal` uses `reqRef` (a `useRef`) with `AbortController` + a sequence number per meal slot. Each new call aborts the previous in-flight request for that slot and ignores responses that arrive after a newer call was made. Do not remove this pattern when modifying `generateMeal`.

**Meal suggestion response format:**
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

**Full recipe response format** (stored in `meals[tiempo].receta`):
```json
{
  "tiempo_total": number,
  "porciones": string,
  "dificultad": string,
  "ingredientes": [{ "nombre": string, "cantidad": string, "unidad": string }],
  "utensilios": string[],
  "pasos": [{ "descripcion": string, "tiempo_minutos": number, "tip": string }],
  "valor_nutricional": { "Calorías": string, "Proteína": string, ... }
}
```

**localStorage persistence:** The day plan (`contexto`, `meals`, `showConfig`) is saved under key `"qch:plan"` with a `fecha` (ISO date). On load, `loadSnapshot()` restores it if the date matches today; otherwise it returns `null` and the app starts fresh. Recipes already fetched are included in the snapshot. `historial` is persisted **separately** under `"qch:historial"` (via `loadHistorial()`) and does **not** reset on day change — it accumulates across days, capped at `HISTORIAL_MAX` (21) entries, so the backend can reason about what was eaten over the last several days, not just within today's session.

**`callGemini` — `thinkingBudget: 0`:** Gemini's thinking mode is explicitly disabled. Without this, the internal reasoning consumes the output token budget and truncates the JSON response.

## Styling

All CSS is written as a `<style>` tag inside the JSX return — not in separate `.css` files (despite `App.css` existing, it is unused). CSS custom properties define the color palette:

```css
--amarillo: #F4A72B
--tierra:   #C25B28
--verde:    #3A7D44
--crema:    #FDF6EC
--cafe:     #5C3317
```

Responsive breakpoint: 1024px. Fonts loaded from Google Fonts (Playfair Display + Nunito).

**Mobile tap-highlight gotcha:** all `<button>`s get a global reset (`-webkit-tap-highlight-color: transparent`, `user-select: none`, `touch-action: manipulation`) because without it, mobile Safari/Chrome render a translucent tap/selection overlay on top of the button text on touch — easy to miss when only testing in a desktop browser. `.config-btn` also uses an opaque `background` (not `transparent`) so its active-state color transition doesn't interpolate through an alpha channel, which is what caused selected option text to look "swallowed" by the fill color on real phones.

## AI Provider & API Key

AI calls go through Google Gemini (`gemini-flash-lite-latest` by default, overridable via `GEMINI_MODEL`), not Claude — switched from Anthropic because of cost. Free-tier daily quotas vary a lot by model and changed when tested in mid-2026: `gemini-2.0-flash` and older returned 0 quota, `gemini-2.5-flash` was capped at a hard 20 requests/day (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`), and `gemini-flash-lite-latest` had no quota error in testing — lite variants tend to get the most generous free allocation. Re-check at https://ai.google.dev/gemini-api/docs/rate-limits if suggestions start falling back to the local catalog often. `GEMINI_API_KEY` lives only in `backend/.env` (get a free key at https://aistudio.google.com/apikey) and is never exposed to the browser. The frontend only knows `VITE_API_URL` (the backend's base URL, e.g. `http://localhost:3001` in dev) and talks to `/api/sugerir-comida` and `/api/receta-completa`. Never commit real keys; `backend/.env.example` documents the required variables.

## Language & Domain

All UI text and prompts are in Colombian Spanish (Bogotá dialect). The system prompt (`CONTEXT_PROMPT`, defined in `backend/src/index.js`) targets middle-income Bogotá families and references local dishes (huevos pericos, changua, tamales, arepas) and stores (Éxito, D1, barrio tiendas). Keep this context when modifying prompts.

`CONTEXT_PROMPT` also nudges suggestions toward "zona azul" (blue zone) principles — more vegetables/legumes, moderate portions, less fried/ultra-processed food — without abandoning local dishes. `buildPrompt()` additionally inspects the last 6 `historial` entries (~2 days): if most are tagged `saludable: false`, it appends an explicit instruction to suggest something lighter to compensate. This is the foundation for the longer-term goal of food-history-aware, health-oriented suggestions (see project memory for the fuller roadmap).
