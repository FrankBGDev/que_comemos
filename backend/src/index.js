import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";


const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? (process.env.ALLOWED_ORIGIN || "").split(",").map((o) => o.trim())
    : [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
      ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Sin header Origin (curl, health checks, server-to-server) no aplica CORS — siempre se permite.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    methods: ["POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// ── RATE LIMITING ────────────────────────────────────────────────────────────
app.use(
  "/api/",
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Demasiadas solicitudes. Por favor espera un momento antes de intentar de nuevo.",
    },
  })
);

app.use(express.json());

// ── PROMPT ───────────────────────────────────────────────────────────────────
const CONTEXT_PROMPT = `Eres un asistente culinario para familias de estrato medio en Bogotá, Colombia.
Conoces muy bien la cocina bogotana y colombiana típica: huevos pericos, caldo de costilla, changua, tamales tolimenses,
arepas, arroz con pollo, frijoles, lentejas, sopa de pasta, mazorca, aguapanela, chocolate santafereño, etc.
Las familias tienen presupuesto moderado, compran en tiendas de barrio y supermercados como Éxito o D1.
Sugiere comidas balanceadas, sabrosas y económicas. Siempre responde en español colombiano natural.`;

function buildRecetaPrompt({ nombre, personas }) {
  return `${CONTEXT_PROMPT}

Genera la receta COMPLETA y detallada de "${nombre}" para ${personas}.
Responde ÚNICAMENTE con un JSON válido (sin texto extra, sin markdown) con esta estructura exacta:
{
  "tiempo_total": 30,
  "porciones": "2 porciones",
  "dificultad": "Fácil",
  "ingredientes": [
    { "nombre": "Huevos", "cantidad": "3", "unidad": "unidades" },
    { "nombre": "Cebolla larga", "cantidad": "2", "unidad": "tallos" }
  ],
  "utensilios": ["sartén", "cuchillo", "tabla"],
  "pasos": [
    { "descripcion": "Descripción del paso en detalle", "tiempo_minutos": 5, "tip": "Consejo opcional para este paso" },
    { "descripcion": "Segundo paso", "tiempo_minutos": 0, "tip": "" }
  ],
  "valor_nutricional": {
    "Calorías": "320 kcal",
    "Proteína": "18g",
    "Carbohidratos": "28g",
    "Grasas": "12g"
  }
}
Los pasos deben ser claros, en orden y con el tiempo_minutos en 0 si es un paso instantáneo.`;
}

// ── GEMINI ───────────────────────────────────────────────────────────────────
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Llama a Gemini con el prompt dado y devuelve el JSON ya parseado.
async function callGemini(prompt, maxOutputTokens) {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens,
        thinkingConfig: { thinkingBudget: 0 }, // sin esto, el "thinking" interno consume el budget y trunca el JSON
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData?.error?.message || `Gemini respondió ${response.status}`);
    err.upstream = true;
    throw err;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

function buildPrompt({ tiempo, contexto, historial = [], dia = "" }) {
  const historialTexto =
    historial.length > 0
      ? `\nEvita repetir estas comidas recientes: ${historial.join(", ")}.`
      : "";

  const diaTexto = dia ? ` para hoy ${dia}` : "";

  return `${CONTEXT_PROMPT}

Contexto familiar:
- Personas en casa: ${contexto.personas}
- Tiempo disponible: ${contexto.tiempo}
- Estado de la nevera: ${contexto.mercado}
${historialTexto}

Sugiere UNA opción de ${tiempo}${diaTexto}.
Responde ÚNICAMENTE con un JSON válido (sin texto extra, sin markdown) con esta estructura exacta:
{
  "nombre": "Nombre del plato",
  "descripcion": "Descripción breve y apetitosa en 1-2 oraciones",
  "ingredientes": ["ingrediente 1", "ingrediente 2", "ingrediente 3"],
  "saludable": true o false,
  "economico": true o false,
  "rapido": true o false,
  "tip": "Un consejo práctico o variación"
}`;
}

// ── ENDPOINT ─────────────────────────────────────────────────────────────────
app.post("/api/sugerir-comida", async (req, res) => {
  const { tiempo, contexto, historial, dia } = req.body;

  if (!tiempo || !contexto) {
    return res.status(400).json({
      error: "Faltan campos obligatorios: tiempo y contexto son requeridos.",
    });
  }

  const tiemposValidos = ["desayuno", "almuerzo", "cena"];
  if (!tiemposValidos.includes(tiempo)) {
    return res.status(400).json({
      error: `El campo "tiempo" debe ser uno de: ${tiemposValidos.join(", ")}.`,
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY no está configurada.");
    return res.status(500).json({
      error: "Error de configuración del servidor. Contacta al administrador.",
    });
  }

  try {
    const comida = await callGemini(buildPrompt({ tiempo, contexto, historial, dia }), 1000);
    return res.json(comida);
  } catch (err) {
    console.error("Error al procesar la sugerencia:", err.message);

    if (err instanceof SyntaxError || err.upstream) {
      return res.status(502).json({
        error: "No se pudo obtener una sugerencia en este momento. Intenta de nuevo.",
      });
    }

    return res.status(500).json({
      error: "Ocurrió un error inesperado. Por favor intenta más tarde.",
    });
  }
});

app.post("/api/receta-completa", async (req, res) => {
  const { nombre, personas } = req.body;

  if (!nombre || !personas) {
    return res.status(400).json({
      error: "Faltan campos obligatorios: nombre y personas son requeridos.",
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY no está configurada.");
    return res.status(500).json({
      error: "Error de configuración del servidor. Contacta al administrador.",
    });
  }

  try {
    const receta = await callGemini(buildRecetaPrompt({ nombre, personas }), 2000);
    return res.json(receta);
  } catch (err) {
    console.error("Error al procesar la receta:", err.message);

    if (err instanceof SyntaxError || err.upstream) {
      return res.status(502).json({
        error: "No se pudo obtener la receta en este momento. Intenta de nuevo.",
      });
    }

    return res.status(500).json({
      error: "Ocurrió un error inesperado. Por favor intenta más tarde.",
    });
  }
});

// ── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada." }));

// ── ERRORES (ej. CORS) ────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(403).json({ error: "Origen no permitido." });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
