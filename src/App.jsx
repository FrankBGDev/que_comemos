import { useState, useEffect, useRef } from "react";
import "./App.css";
import { supabase, supabaseConfigured } from "./supabaseClient";
import { REGIONES, pickFromCatalogo } from "./data/catalogo";
import {
  STORAGE_KEY, HISTORIAL_KEY, PERFIL_KEY, HISTORIAL_MAX, PERFIL_VACIO,
  hoyISO, loadSnapshot, loadHistorial, loadPerfil,
} from "./data/storage";
import AuthScreen, { RecoveryForm } from "./components/AuthScreen";
import PerfilScreen from "./components/PerfilScreen";
import MealCard from "./components/MealCard";
import RecipeModal from "./components/RecipeModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const PREGUNTAS_CONTEXTO = [
  { id: "personas", label: "¿Cuántas personas en casa?", options: ["Solo", "2 personas", "3-4 personas", "5 o más"] },
  { id: "tiempo", label: "¿Cuánto tiempo tienes para cocinar?", options: ["Menos de 20 min", "20-40 min", "Más de 40 min"] },
  { id: "mercado", label: "¿Qué tan surtida está la nevera?", options: ["Casi vacía", "Lo básico", "Bien surtida"] },
];

const OPCIONES_DIETA = ["De todo", "Vegetariano", "Vegano", "Sin gluten", "Sin lácteos"];

const REGION_KICKERS = {
  "Bogotá": "Sabores bogotanos",
  "Tolima": "Sabores tolimenses",
  "Antioquia": "Sabores paisas",
  "Costa Atlántica": "Sabores costeños",
  "Costa Pacífica": "Sabores del Pacífico",
  "Santander": "Sabores santandereanos",
  "Eje Cafetero": "Sabores cafeteros",
};

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

async function buscarImagen(nombre, region) {
  try {
    const res = await fetch(`${API_URL}/api/buscar-imagen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, region }),
    });
    if (!res.ok) return null;
    const { url } = await res.json();
    return url || null;
  } catch {
    return null;
  }
}

// ── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function BogotaMealPlanner() {
  const snap = typeof window !== "undefined" ? loadSnapshot() : null;

  const [contexto, setContexto] = useState(snap?.contexto ?? {
    personas: "2 personas",
    tiempo: "20-40 min",
    mercado: "Lo básico",
    region: "Bogotá",
    dieta: "De todo",
  });
  const [meals, setMeals] = useState(snap?.meals ?? { desayuno: null, almuerzo: null, cena: null });
  const [loading, setLoading] = useState({ desayuno: false, almuerzo: false, cena: false });
  const [loadingAll, setLoadingAll] = useState(false);
  const [showDetalle, setShowDetalle] = useState(snap ? !!snap.showConfig : false);
  const [dia] = useState(DIAS[new Date().getDay()]);
  const [historial, setHistorial] = useState(typeof window !== "undefined" ? loadHistorial() : []);
  const [modalTiempo, setModalTiempo] = useState(null);
  const [loadingReceta, setLoadingReceta] = useState(false);
  const [perfil, setPerfil] = useState(typeof window !== "undefined" ? loadPerfil() : PERFIL_VACIO);
  const [vista, setVista] = useState("plan");
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(supabaseConfigured);
  const [recoveryMode, setRecoveryMode] = useState(false);

  const reqRef = useRef({});

  // ── AUTH ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      setSession(newSession);
      setAuthLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ── SYNC SUPABASE → LOCAL ─────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    supabase
      .from("perfiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error("Error cargando perfil remoto:", error.message); return; }
        if (data) {
          setPerfil({
            alergias: data.alergias || "",
            composicion: data.composicion || "",
            objetivo: data.objetivo || "",
            noQuieren: data.no_quieren || "",
            _completado: !!(data.alergias || data.composicion || data.objetivo || data.no_quieren),
            _descartado: true,
          });
          if (data.contexto && Object.keys(data.contexto).length) setContexto(data.contexto);
          if (Array.isArray(data.historial)) setHistorial(data.historial);
        }
      });
  }, [session]);

  // ── SYNC LOCAL → SUPABASE ─────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    supabase
      .from("perfiles")
      .upsert({
        id: session.user.id,
        alergias: perfil.alergias,
        composicion: perfil.composicion,
        objetivo: perfil.objetivo,
        no_quieren: perfil.noQuieren,
        contexto,
        historial,
        updated_at: new Date().toISOString(),
      })
      .then(({ error }) => { if (error) console.error("Error guardando perfil remoto:", error.message); });
  }, [session, perfil, contexto, historial]);

  // ── PERSISTENCIA LOCAL ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ fecha: hoyISO(), contexto, meals, showConfig: showDetalle }));
    } catch { /* almacenamiento no disponible */ }
  }, [contexto, meals, showDetalle]);

  useEffect(() => {
    try { localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial)); } catch { /* sin acceso */ }
  }, [historial]);

  useEffect(() => {
    try { localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil)); } catch { /* sin acceso */ }
  }, [perfil]);

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setVista("plan");
  };

  const guardarPerfil = (form) => {
    setPerfil({ ...form, _completado: true, _descartado: false });
    setVista("plan");
  };

  const cerrarPerfil = () => {
    setPerfil(p => (p._completado ? p : { ...p, _descartado: true }));
    setVista("plan");
  };

  const generateMeal = async (tiempo, ctx) => {
    if (reqRef.current[tiempo]?.ctrl) reqRef.current[tiempo].ctrl.abort();
    const ctrl = new AbortController();
    const seq = (reqRef.current[tiempo]?.seq || 0) + 1;
    reqRef.current[tiempo] = { ctrl, seq };
    const esVigente = () => reqRef.current[tiempo]?.seq === seq;

    setLoading(prev => ({ ...prev, [tiempo]: true }));
    try {
      const response = await fetch(`${API_URL}/api/sugerir-comida`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({ tiempo, contexto: ctx, historial, dia, perfil }),
      });
      const parsed = await response.json();
      if (!response.ok || !parsed?.nombre) throw new Error(parsed?.error || "Respuesta del servidor no válida");
      const meal = {
        nombre: parsed.nombre,
        descripcion: parsed.descripcion || "",
        ingredientes: Array.isArray(parsed.ingredientes) ? parsed.ingredientes : [],
        saludable: !!parsed.saludable,
        economico: !!parsed.economico,
        rapido: !!parsed.rapido,
        tip: parsed.tip || "",
      };
      if (!esVigente()) return;
      setMeals(prev => ({ ...prev, [tiempo]: meal }));
      setHistorial(prev => [
        { nombre: meal.nombre, tiempo, fecha: hoyISO(), saludable: meal.saludable },
        ...prev,
      ].slice(0, HISTORIAL_MAX));

      // Imagen en segundo plano — no bloquea el render del plato
      buscarImagen(meal.nombre, ctx.region).then(imagen => {
        if (imagen && esVigente()) {
          setMeals(prev => prev[tiempo] ? { ...prev, [tiempo]: { ...prev[tiempo], imagen } } : prev);
        }
      });
    } catch (err) {
      if (err.name === "AbortError" || !esVigente()) return;
      console.error("Generación falló, usando catálogo local:", err);
      const local = pickFromCatalogo(tiempo, historial, ctx?.dieta, ctx?.region, perfil);
      if (local) {
        setMeals(prev => ({ ...prev, [tiempo]: { ...local, fallback: true } }));
        setHistorial(prev => [
          { nombre: local.nombre, tiempo, fecha: hoyISO(), saludable: !!local.saludable },
          ...prev,
        ].slice(0, HISTORIAL_MAX));
        buscarImagen(local.nombre, ctx?.region).then(imagen => {
          if (imagen && esVigente()) {
            setMeals(prev => prev[tiempo] ? { ...prev, [tiempo]: { ...prev[tiempo], imagen } } : prev);
          }
        });
      }
    } finally {
      if (esVigente()) setLoading(prev => ({ ...prev, [tiempo]: false }));
    }
  };

  const loadReceta = async (tiempo) => {
    const meal = meals[tiempo];
    if (!meal || meal.receta) return;
    setLoadingReceta(true);
    try {
      const response = await fetch(`${API_URL}/api/receta-completa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: meal.nombre, personas: contexto.personas, region: contexto.region, perfil }),
      });
      const receta = await response.json();
      if (!response.ok) throw new Error(receta?.error || "No se pudo cargar la receta");
      setMeals(prev => ({ ...prev, [tiempo]: { ...prev[tiempo], receta } }));
    } catch (err) {
      console.error(err);
    }
    setLoadingReceta(false);
  };

  const generateAll = async () => {
    setLoadingAll(true);
    await Promise.all(Object.keys(meals).map(t => generateMeal(t, contexto)));
    setLoadingAll(false);
  };

  const resetDay = () => {
    setMeals({ desayuno: null, almuerzo: null, cena: null });
  };

  // ── DERIVADOS ────────────────────────────────────────────────────────────
  const mealsDone = Object.values(meals).filter(m => m !== null).length;
  const hayMeals = mealsDone > 0;
  const kicker = REGION_KICKERS[contexto.region] || "Sabores de Colombia";

  const emailPrefix = session?.user?.email?.split("@")[0] || "amigo";
  const userName = (emailPrefix.split(".")[0]).charAt(0).toUpperCase() + emailPrefix.split(".")[0].slice(1);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {supabaseConfigured && authLoading ? (
        <div className="auth-screen"><p className="auth-screen__tag">Cargando...</p></div>
      ) : supabaseConfigured && recoveryMode ? (
        <RecoveryForm onDone={() => setRecoveryMode(false)} />
      ) : supabaseConfigured && !session ? (
        <AuthScreen />
      ) : vista === "perfil" ? (
        <PerfilScreen perfil={perfil} onSave={guardarPerfil} onBack={cerrarPerfil} />
      ) : (
        <>
          {/* HEADER */}
          <div className="header">
            <div className="header__row">
              <div>
                <div className="header__kicker">{kicker}</div>
                <h1 className="header__title">¿Qué comemos<br />hoy?</h1>
                {dia && <p className="header__dia-sub">Hoy es <strong>{dia}</strong></p>}
              </div>
              <div className="header__user-wrap">
                <div className="header__avatar">{userName.charAt(0)}</div>
                <div className="header__greeting">Hola, {userName}</div>
                {supabaseConfigured && session && (
                  <button className="header__logout" onClick={cerrarSesion}>Cerrar sesión</button>
                )}
              </div>
            </div>
            {mealsDone > 0 && (
              <div className="header__progress">
                <span className="header__progress-text">
                  {mealsDone} de 3 comidas listas{mealsDone === 3 ? " ✓" : ""}
                </span>
                <div className="progress-bar">
                  <div className="progress-bar__fill" style={{ width: `${(mealsDone / 3) * 100}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* ACCIONES DE USUARIO */}
          <div className="user-actions">
            {perfil._completado || perfil._descartado ? (
              <button className="perfil-link" onClick={() => setVista("perfil")}>
                👤 {perfil._completado ? "Editar perfil familiar" : "Completar perfil familiar"}
              </button>
            ) : (
              <div className="perfil-banner">
                <span className="perfil-banner__icon">📋</span>
                <div className="perfil-banner__text">
                  <strong>Completa el perfil de tu familia</strong>
                  <span>Alergias, niños en casa y tus prioridades — para sugerencias más precisas.</span>
                </div>
                <div className="perfil-banner__actions">
                  <button className="perfil-banner__btn" onClick={() => setVista("perfil")}>Completar</button>
                  <button className="perfil-banner__close" onClick={() => setPerfil(p => ({ ...p, _descartado: true }))} aria-label="Descartar">✕</button>
                </div>
              </div>
            )}
          </div>

          {/* CONFIGURACIÓN RÁPIDA */}
          <div className="quick-panel">
            <div className="quick-panel__head">
              <span className="quick-panel__icon">🗺</span>
              <div>
                <div className="quick-panel__title">¿Qué quieres comer hoy?</div>
                <div className="quick-panel__hint">Elige región y empieza — o personaliza más abajo</div>
              </div>
            </div>

            <div className="quick-section">
              <span className="quick-label">Cocina regional</span>
              <div className="chips-scroll">
                {REGIONES.map(r => (
                  <button
                    key={r}
                    className={`chip ${contexto.region === r ? "chip--active" : ""}`}
                    onClick={() => setContexto(prev => ({ ...prev, region: r }))}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="quick-section">
              <span className="quick-label">Preferencia alimentaria</span>
              <div className="chips-wrap">
                {OPCIONES_DIETA.map(d => (
                  <button
                    key={d}
                    className={`chip ${contexto.dieta === d ? "chip--active" : ""}`}
                    onClick={() => setContexto(prev => ({ ...prev, dieta: d }))}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-detalle" onClick={() => setShowDetalle(v => !v)}>
              {showDetalle ? "▴ Ocultar detalles" : "⚙ Personalizar (personas, tiempo, nevera)"}
            </button>
          </div>

          {showDetalle && (
            <div className="detail-panel">
              {PREGUNTAS_CONTEXTO.map(q => (
                <div className="config-item" key={q.id}>
                  <label>{q.label}</label>
                  <div className="config-options">
                    {q.options.map(opt => (
                      <button
                        key={opt}
                        className={`config-btn ${contexto[q.id] === opt ? "config-btn--active" : ""}`}
                        onClick={() => setContexto(prev => ({ ...prev, [q.id]: opt }))}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BOTÓN PLANEAR TODO */}
          <div className="actions">
            <button className="btn btn--gold" onClick={generateAll} disabled={loadingAll}>
              ✦ {loadingAll ? "Preparando tu menú..." : "Planear todo el día"}
            </button>
            {hayMeals && (
              <button className="btn btn--danger" onClick={resetDay}>
                Empezar de nuevo
              </button>
            )}
          </div>

          {/* TARJETAS DE COMIDA — siempre visibles */}
          <div className="cards-container">
            {Object.keys(meals).map(tiempo => (
              <MealCard
                key={tiempo}
                tiempo={tiempo}
                meal={meals[tiempo]}
                loading={loading[tiempo]}
                onGenerate={generateMeal}
                contexto={contexto}
                onVerReceta={(t) => setModalTiempo(t)}
              />
            ))}
          </div>

          <p className="footer-note">
            Hecho con cariño para las familias de Colombia<br />
            Fotos: <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>Pexels</a>
          </p>

          {/* MODAL RECETA COMPLETA */}
          {modalTiempo && meals[modalTiempo] && (
            <RecipeModal
              meal={meals[modalTiempo]}
              tiempo={modalTiempo}
              onClose={() => setModalTiempo(null)}
              onLoadReceta={() => loadReceta(modalTiempo)}
              loadingReceta={loadingReceta}
            />
          )}
        </>
      )}
    </div>
  );
}
