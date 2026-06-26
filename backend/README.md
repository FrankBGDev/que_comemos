# ¿Qué comemos hoy? — Backend

Servidor Express que actúa como proxy seguro entre el frontend React y la API de Google Gemini.

## Requisitos

- Node.js 18 o superior

## Instalación local

```bash
cd backend
npm install
cp .env.example .env
```

Edita `.env` y agrega tu API key de Gemini (gratis en [aistudio.google.com/apikey](https://aistudio.google.com/apikey)):

```
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Inicia el servidor:

```bash
# Producción
npm start

# Desarrollo (recarga automática)
npm run dev
```

El servidor queda disponible en `http://localhost:3001`.

## Endpoint

### `POST /api/sugerir-comida`

**Body (JSON):**

```json
{
  "tiempo": "desayuno",
  "contexto": {
    "personas": "2 personas",
    "tiempo": "20-40 min",
    "mercado": "Lo básico"
  },
  "historial": ["Huevos pericos", "Arepas"],
  "dia": "Lunes"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `tiempo` | string | ✅ | `desayuno`, `almuerzo` o `cena` |
| `contexto` | object | ✅ | Preferencias del usuario |
| `historial` | string[] | ❌ | Nombres de comidas recientes a evitar |
| `dia` | string | ❌ | Día de la semana en español |

**Respuesta exitosa (200):**

```json
{
  "nombre": "Changua",
  "descripcion": "Sopa bogotana de leche con huevo, perfecta para empezar el día.",
  "ingredientes": ["leche", "huevos", "cebolla larga", "cilantro", "sal"],
  "saludable": true,
  "economico": true,
  "rapido": true,
  "tip": "Agrega un poco de pan aliñado o calado para una versión más contundente."
}
```

**Respuesta de error (4xx / 5xx):**

```json
{
  "error": "Mensaje descriptivo en español"
}
```

### `POST /api/receta-completa`

**Body (JSON):**

```json
{
  "nombre": "Changua",
  "personas": "2 personas"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre` | string | ✅ | Nombre del plato a detallar |
| `personas` | string | ✅ | Número de personas para ajustar cantidades |

**Respuesta exitosa (200):** objeto con `tiempo_total`, `porciones`, `dificultad`, `ingredientes`, `utensilios`, `pasos` y `valor_nutricional`.

### `GET /health`

Verifica que el servidor está activo.

## Despliegue en Railway

1. Crea una cuenta en [railway.app](https://railway.app) y conecta tu repositorio de GitHub.
2. Selecciona la carpeta `backend/` como directorio raíz del servicio (`Root Directory: backend`).
3. Railway detecta el `package.json` y usa `npm start` automáticamente.
4. En **Variables**, agrega:
   - `GEMINI_API_KEY` → tu API key
   - `NODE_ENV` → `production`
   - `ALLOWED_ORIGIN` → la URL de tu frontend (ej. `https://que-comemos-hoy.vercel.app`)
5. Despliega. Railway asigna un dominio público automáticamente.

## Despliegue en Render

1. Crea una cuenta en [render.com](https://render.com) y selecciona **New → Web Service**.
2. Conecta tu repositorio y configura:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** `Node`
3. En **Environment Variables**, agrega las mismas variables que en Railway.
4. Render asigna un dominio en `*.onrender.com`.

> **Nota:** El plan gratuito de Render pone el servicio a dormir tras 15 minutos de inactividad. La primera solicitud puede tardar ~30 segundos en despertar.

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `GEMINI_API_KEY` | ✅ | API key de Google Gemini (gratuita en [aistudio.google.com/apikey](https://aistudio.google.com/apikey)) |
| `GEMINI_MODEL` | ❌ | Modelo a usar (por defecto `gemini-flash-lite-latest`; `gemini-2.5-flash` solo da 20 solicitudes/día gratis) |
| `PORT` | ❌ | Puerto del servidor (por defecto `3001`) |
| `NODE_ENV` | ❌ | `development` o `production` |
| `ALLOWED_ORIGIN` | En producción | Orígenes CORS permitidos (separados por coma) |
