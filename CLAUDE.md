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
├── LoadingDots    ← animation only
└── MealCard       ← rendered 3×: desayuno, almuerzo, cena
```

**State shape:**
```js
contexto:   { personas, tiempo, mercado }  // user config selections
meals:      { desayuno, almuerzo, cena }   // current meal suggestions (null or object)
loading:    { desayuno, almuerzo, cena }   // per-meal loading flags
loadingAll: bool                           // "plan full day" in progress
showConfig: bool
dia:        string                         // Spanish day name, set on mount
historial:  string[]                       // last 10 meal names, sent to the backend to avoid repeats
```

**Data flow:**
1. User picks `contexto` options → clicks "Planear todo el día"
2. `generateAll()` calls `generateMeal(tiempo)` for all three meals in parallel via `Promise.all`
3. `generateMeal()` sends `{ tiempo, contexto, historial, dia }` → `fetch` to the backend proxy (`${VITE_API_URL}/api/sugerir-comida`), which builds the prompt and calls Gemini
4. Backend returns the parsed meal JSON directly → stored in `meals[tiempo]`
5. "Otra opción 🔄" triggers `generateMeal()` for a single meal slot
6. "Ver receta" calls `loadReceta(tiempo)` → `fetch` to `${VITE_API_URL}/api/receta-completa` for the full step-by-step recipe

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

## AI Provider & API Key

AI calls go through Google Gemini (`gemini-2.5-flash` by default, overridable via `GEMINI_MODEL`), not Claude — switched from Anthropic because of cost. `gemini-2.0-flash` and older models returned `RESOURCE_EXHAUSTED` (0 free-tier quota) when tested in mid-2026, so the default tracks whichever current-gen flash model still has free quota — re-check at https://ai.google.dev/gemini-api/docs/rate-limits if suggestions start failing. `GEMINI_API_KEY` lives only in `backend/.env` (get a free key at https://aistudio.google.com/apikey) and is never exposed to the browser. The frontend only knows `VITE_API_URL` (the backend's base URL, e.g. `http://localhost:3001` in dev) and talks to `/api/sugerir-comida` and `/api/receta-completa`. Never commit real keys; `backend/.env.example` documents the required variables.

## Language & Domain

All UI text and prompts are in Colombian Spanish (Bogotá dialect). The system prompt (`CONTEXT_PROMPT`, defined in `backend/src/index.js`) targets middle-income Bogotá families and references local dishes (huevos pericos, changua, tamales, arepas) and stores (Éxito, D1, barrio tiendas). Keep this context when modifying prompts.
