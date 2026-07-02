import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createClient } from "@supabase/supabase-js";

// ── SUPABASE ADMIN ────────────────────────────────────────────────────────────
// Service role key — bypasea RLS, solo para backend. Nunca en el frontend.
const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;


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
// Rutas de IA (Gemini): límite conservador por costo.
app.use(
  ["/api/sugerir-comida", "/api/receta-completa"],
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiadas solicitudes. Por favor espera un momento antes de intentar de nuevo." },
  })
);
// Imágenes: límite más alto (no consume Gemini).
app.use(
  "/api/buscar-imagen",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiadas solicitudes de imágenes. Intenta más tarde." },
  })
);

app.use(express.json());

// ── PROMPT ───────────────────────────────────────────────────────────────────
// Contexto regional: ajusta de qué región colombiana es la "sazón" de la familia.
// Las claves deben coincidir exactamente con REGIONES en src/App.jsx.
const REGIONES = {
  "Bogotá": { lugar: "Bogotá, Colombia", platos: "huevos pericos, caldo de costilla, changua, tamales tolimenses, arepas, ajiaco, frijoles, lentejas, sopa de pasta, mazorca, aguapanela, chocolate santafereño" },
  "Tolima": { lugar: "el departamento del Tolima, Colombia", platos: "tamal tolimense, lechona, viudo de pescado, mondongo, envuelto de mazorca, achiras, masato" },
  "Antioquia": { lugar: "Antioquia, Colombia (cocina paisa)", platos: "bandeja paisa, frijoles antioqueños, mondongo, sancocho de gallina, arepa antioqueña, mazamorra, chorizo" },
  "Costa Atlántica": { lugar: "la Costa Atlántica colombiana (Caribe)", platos: "sancocho de mariscos, arroz de lisa, mote de queso, butifarra, pescado frito con patacón, arroz con coco, carimañola" },
  "Costa Pacífica": { lugar: "la Costa Pacífica colombiana (Chocó, Buenaventura, Nariño costero)", platos: "encocado de pescado, arroz con coco y camarón, ceviche de camarón, tapao de pescado, empanada de camarón, borojó" },
  "Santander": { lugar: "Santander, Colombia", platos: "cabro o pepitoria, mute santandereano, arepa santandereana de maíz pelao, pan de yuca, bagre asado" },
  "Eje Cafetero": { lugar: "el Eje Cafetero y el Valle del Cauca, Colombia", platos: "sancocho valluno, fríjoles con garra, arepa valluna, aborrajados, pandebono, tamal vallecaucano" },
};

function buildContextPrompt(region) {
  const r = REGIONES[region] || REGIONES["Bogotá"];
  return `Eres un asistente culinario para familias de estrato medio en ${r.lugar}.
Conoces muy bien la cocina típica de la zona: ${r.platos}, etc.
Las familias tienen presupuesto moderado, compran en tiendas de barrio y supermercados como Éxito o D1.
Sugiere comidas auténticas, sabrosas y económicas de la región. Siempre responde en español colombiano natural.
Respeta los platos tal como son — una lechona es una lechona, un calentado es un calentado.
No agregues guarniciones, ensaladas ni acompañamientos que no sean propios del plato o de la tradición regional.
Varía el tipo de preparación: la cocina colombiana incluye sopas, caldos, sudados, arroces, platos de fríjoles,
asados, fritos, huevos y más — ninguno debe dominar sobre los otros. Si la sugerencia reciente ya fue una sopa,
prefiere un sudado o un plato seco; si fue arroz, considera fríjoles o huevos. El objetivo es variedad real.`;
}

function buildRecetaPrompt({ nombre, personas, region, perfil }) {
  const alergiaTexto = perfil?.alergias?.trim()
    ? `\nRESTRICCIÓN DE SALUD (obligatoria): evita por completo estos ingredientes en la receta y en cualquier variación que sugieras: ${perfil.alergias.trim()}.`
    : "";

  return `${buildContextPrompt(region)}

Genera la receta COMPLETA y detallada de "${nombre}" para ${personas}.${alergiaTexto}
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
Los pasos deben ser claros, en orden y con el tiempo_minutos en 0 si es un paso instantáneo.
Usa MÁXIMO 6 pasos en total — agrupa sub-pasos pequeños en uno solo si es necesario, nunca generes más de 6.`;
}

// ── GEMINI ───────────────────────────────────────────────────────────────────
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
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

// Instrucción extra según la restricción alimentaria seleccionada. "De todo" (o cualquier valor
// desconocido) no agrega nada — ver DIETA_TAGS en src/App.jsx para las opciones que ofrece la UI.
const DIETA_INSTRUCCIONES = {
  "Vegetariano": "\nLa familia es vegetariana: la sugerencia NO debe incluir carne, pollo, pescado ni mariscos. Huevos y lácteos sí están permitidos.",
  "Vegano": "\nLa familia es vegana: la sugerencia NO debe incluir ningún producto de origen animal (carne, pollo, pescado, huevos, leche, queso, mantequilla, miel, etc.).",
  "Sin gluten": "\nAlguien en la familia no puede comer gluten: evita trigo, pan, pasta, harina de trigo y cualquier ingrediente que lo contenga.",
  "Sin lácteos": "\nAlguien en la familia no puede comer lácteos: evita leche, queso, crema, mantequilla y derivados.",
};

// Instrucción extra según el perfil familiar (se llena una sola vez, ver PerfilScreen en
// src/App.jsx). Las alergias son la única restricción dura aquí; lo demás es un matiz.
const PERFIL_OBJETIVO_INSTRUCCIONES = {
  "Comer más sano": "\nLa prioridad principal de la familia es comer más sano: refuerza aún más las sugerencias balanceadas y con más vegetales.",
  "Ahorrar al máximo": "\nLa prioridad principal de la familia es ahorrar: prioriza ingredientes económicos y fáciles de conseguir por encima de cualquier otra consideración.",
  "Variar y no aburrirse": "\nLa prioridad principal de la familia es variar: evita con más fuerza repetir platos o estilos similares a los recientes.",
};

function buildPerfilTexto(perfil) {
  if (!perfil) return "";
  let texto = "";

  if (perfil.alergias?.trim()) {
    texto += `\nRESTRICCIÓN DE SALUD (obligatoria): la familia tiene alergias o debe evitar por completo estos ingredientes: ${perfil.alergias.trim()}. Nunca sugieras un plato que los contenga, bajo ninguna circunstancia.`;
  }
  if (perfil.composicion === "Niños pequeños" || perfil.composicion === "Ambos") {
    texto += "\nHay niños pequeños en casa: evita platos muy picantes o con huesos/espinas, prefiere texturas fáciles de comer.";
  }
  if (perfil.composicion === "Adultos mayores" || perfil.composicion === "Ambos") {
    texto += "\nHay adultos mayores en casa: prefiere preparaciones blandas y fáciles de digerir, sin exceso de picante ni fritos pesados.";
  }
  texto += PERFIL_OBJETIVO_INSTRUCCIONES[perfil.objetivo] || "";
  if (perfil.noQuieren?.trim()) {
    texto += `\nLa familia no quiere volver a ver estos platos o ingredientes, evítalos: ${perfil.noQuieren.trim()}.`;
  }

  return texto;
}

function buildPrompt({ tiempo, contexto, historial = [], dia = "", perfil = null }) {
  const nombresRecientes = historial.map((h) => h.nombre).filter(Boolean);
  const historialTexto =
    nombresRecientes.length > 0
      ? `\nEvita repetir estas comidas recientes: ${nombresRecientes.join(", ")}.`
      : "";

  // Mira solo las últimas comidas (~2 días) para decidir si hay que compensar.
  const recientes = historial.slice(0, 6);
  const noSaludables = recientes.filter((h) => h.saludable === false).length;
  const balanceTexto =
    recientes.length >= 3 && noSaludables >= Math.ceil(recientes.length / 2)
      ? "\nLas últimas comidas han sido bastante contundentes — para balancear, considera hoy una opción más ligera: un arroz con verduras, un plato de fríjoles o lentejas, un sudado o una pechuga a la plancha."
      : "";

  const dietaTexto = DIETA_INSTRUCCIONES[contexto.dieta] || "";
  const perfilTexto = buildPerfilTexto(perfil);

  const diaTexto = dia ? ` para hoy ${dia}` : "";

  return `${buildContextPrompt(contexto.region)}

Contexto familiar:
- Personas en casa: ${contexto.personas}
- Tiempo disponible: ${contexto.tiempo}
- Estado de la nevera: ${contexto.mercado}
${historialTexto}${balanceTexto}${dietaTexto}${perfilTexto}

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

// ── DB HELPERS ────────────────────────────────────────────────────────────────

// Devuelve un plato aleatorio de la DB que coincida con region/tiempo/dieta,
// excluyendo nombres recientes. Devuelve null si no hay DB o no hay coincidencia.
async function buscarPlatoEnDB({ region, tiempo, dieta, historial = [], perfil = null }) {
  if (!supabase) return null;

  const nombresRecientes = historial.map((h) => h.nombre).filter(Boolean);
  const noQuierenTerms = perfil?.noQuieren
    ?.split(",").map((t) => t.trim().toLowerCase()).filter((t) => t.length >= 3) || [];
  const alergiaTerms = perfil?.alergias
    ?.split(",").map((t) => t.trim().toLowerCase()).filter((t) => t.length >= 3) || [];
  const excluidos = new Set([...nombresRecientes.map((n) => n.toLowerCase())]);

  let query = supabase
    .from("platos")
    .select("nombre, descripcion, ingredientes, tip, saludable, economico, rapido, dieta, imagen_url")
    .eq("region", region)
    .eq("tiempo", tiempo)
    .eq("activo", true);

  // Filtro de dieta
  const DIETA_DB_TAGS = {
    "Vegetariano": "vegetariano",
    "Vegano": "vegano",
    "Sin gluten": "sinGluten",
    "Sin lácteos": "sinLacteos",
  };
  const dietaTag = DIETA_DB_TAGS[dieta];
  if (dietaTag) {
    query = query.contains("dieta", [dietaTag]);
  }

  const { data, error } = await query;
  if (error || !data?.length) return null;

  // Filtrar exclusiones en JS (más flexible que SQL para texto parcial)
  const candidatos = data.filter((p) => {
    const nombre = p.nombre.toLowerCase();
    if (excluidos.has(nombre)) return false;
    const textoPlato = `${p.nombre} ${(p.ingredientes || []).join(" ")}`.toLowerCase();
    if (noQuierenTerms.some((t) => textoPlato.includes(t))) return false;
    if (alergiaTerms.some((t) => textoPlato.includes(t))) return false;
    return true;
  });

  if (!candidatos.length) return null;

  const plato = candidatos[Math.floor(Math.random() * candidatos.length)];
  return {
    nombre: plato.nombre,
    descripcion: plato.descripcion,
    ingredientes: plato.ingredientes,
    tip: plato.tip,
    saludable: plato.saludable,
    economico: plato.economico,
    rapido: plato.rapido,
    ...(plato.imagen_url ? { imagen: plato.imagen_url } : {}),
    _fromDB: true,
  };
}

// Guarda una sugerencia de Gemini en la tabla platos (silencioso si falla).
async function guardarPlatoEnDB(plato, { region, tiempo }) {
  if (!supabase || !plato?.nombre) return;
  const { nombre, descripcion, ingredientes, tip, saludable, economico, rapido } = plato;
  await supabase.from("platos").upsert(
    { nombre, region, tiempo, descripcion, ingredientes: ingredientes || [], tip: tip || "",
      saludable: !!saludable, economico: !!economico, rapido: !!rapido },
    { onConflict: "nombre,region,tiempo", ignoreDuplicates: false }
  ).select();
}

// Devuelve los pasos de receta ya guardados en DB para un plato, o null si no existen.
async function buscarRecetaEnDB(nombre, region) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("platos")
    .select("tiempo_preparacion_min, porciones, dificultad, ingredientes, pasos, valor_nutricional")
    .eq("nombre", nombre)
    .eq("region", region)
    .not("pasos", "is", null)
    .maybeSingle();
  if (error || !data?.pasos) return null;
  return {
    tiempo_total: data.tiempo_preparacion_min,
    porciones: data.porciones,
    dificultad: data.dificultad,
    ingredientes: data.ingredientes,
    pasos: data.pasos,
    valor_nutricional: data.valor_nutricional,
  };
}

// Guarda la receta devuelta por Gemini en la fila existente del plato (silencioso si falla).
async function guardarRecetaEnDB(receta, nombre, region) {
  if (!supabase || !nombre || !receta?.pasos) return;
  await supabase.from("platos").update({
    tiempo_preparacion_min: receta.tiempo_total,
    porciones: receta.porciones,
    dificultad: receta.dificultad,
    pasos: receta.pasos,
    valor_nutricional: receta.valor_nutricional,
  }).eq("nombre", nombre).eq("region", region);
}

// ── ENDPOINT ─────────────────────────────────────────────────────────────────
app.post("/api/sugerir-comida", async (req, res) => {
  const { tiempo, contexto, historial, dia, perfil } = req.body;

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

  // 1. Intentar respuesta instantánea desde la DB
  try {
    const platoDB = await buscarPlatoEnDB({
      region: contexto.region || "Bogotá",
      tiempo,
      dieta: contexto.dieta,
      historial,
      perfil,
    });
    if (platoDB) {
      const { _fromDB, ...comida } = platoDB;
      return res.json(comida);
    }
  } catch (dbErr) {
    console.error("Error consultando DB (continuando con Gemini):", dbErr.message);
  }

  // 2. Fallback a Gemini
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY no está configurada.");
    return res.status(500).json({
      error: "Error de configuración del servidor. Contacta al administrador.",
    });
  }

  try {
    const comida = await callGemini(buildPrompt({ tiempo, contexto, historial, dia, perfil }), 1000);
    // Guardar en DB en background para la próxima vez
    guardarPlatoEnDB(comida, { region: contexto.region || "Bogotá", tiempo }).catch(() => {});
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
  const { nombre, personas, region, perfil } = req.body;

  if (!nombre || !personas) {
    return res.status(400).json({
      error: "Faltan campos obligatorios: nombre y personas son requeridos.",
    });
  }

  // 1. Intentar receta pre-guardada en DB
  try {
    const recetaDB = await buscarRecetaEnDB(nombre, region || "Bogotá");
    if (recetaDB) return res.json(recetaDB);
  } catch (dbErr) {
    console.error("Error consultando receta en DB (continuando con Gemini):", dbErr.message);
  }

  // 2. Fallback a Gemini
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY no está configurada.");
    return res.status(500).json({
      error: "Error de configuración del servidor. Contacta al administrador.",
    });
  }

  try {
    const receta = await callGemini(buildRecetaPrompt({ nombre, personas, region, perfil }), 2000);
    // Guardar en DB en background
    guardarRecetaEnDB(receta, nombre, region || "Bogotá").catch(() => {});
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

// ── IMÁGENES (Pexels) ────────────────────────────────────────────────────────
app.post("/api/buscar-imagen", async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.json({ url: null });
  if (!process.env.PEXELS_API_KEY) return res.json({ url: null });

  try {
    const query = encodeURIComponent(`${nombre} comida colombiana`);
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=3&orientation=landscape&size=medium`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    );
    if (!response.ok) return res.json({ url: null });
    const data = await response.json();
    const url = data.photos?.[0]?.src?.medium || null;
    return res.json({ url });
  } catch (err) {
    console.error("Error buscando imagen en Pexels:", err.message);
    return res.json({ url: null });
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
