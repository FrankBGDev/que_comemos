# ¿Qué comemos hoy?

Planificador de comidas diarias para familias bogotanas, con sugerencias generadas por IA (Google Gemini) y recetas paso a paso.

## Estructura

- **Frontend** (esta carpeta): React + Vite, todo en `src/App.jsx`.
- **`backend/`**: proxy Express que protege la API key de Gemini. Ver [backend/README.md](backend/README.md).

## Desarrollo local

```bash
# Backend (en otra terminal)
cd backend
npm install
cp .env.example .env   # agrega tu GEMINI_API_KEY
npm run dev             # http://localhost:3001

# Frontend
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:3001 por defecto
npm run dev              # http://localhost:5173
```

```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run lint      # ESLint check (no auto-fix; fix manually)
```

No hay framework de tests configurado.

## Despliegue

- **Frontend → Vercel**: importa este repo en [vercel.com](https://vercel.com), framework preset "Vite" (autodetectado), y agrega la variable de entorno `VITE_API_URL` con la URL pública de tu backend en Render.
- **Backend → Render**: ver la sección "Despliegue en Render" en [backend/README.md](backend/README.md).
