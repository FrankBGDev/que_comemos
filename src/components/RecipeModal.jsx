import { useState, useEffect } from "react";
import { TIEMPO_LABELS } from "../data/catalogo";

export function RecipeSkeleton() {
  return (
    <div>
      <div className="skeleton skeleton--line" style={{ width: "40%", height: "16px", marginBottom: "14px" }} />
      <div className="skeleton skeleton--block" />
      <div className="skeleton skeleton--block" />
      <div className="skeleton skeleton--block" style={{ width: "88%", marginBottom: "20px" }} />
      <div className="skeleton skeleton--line" style={{ width: "35%", height: "16px", marginBottom: "14px" }} />
      <div className="skeleton skeleton--block" style={{ height: "70px" }} />
    </div>
  );
}

export default function RecipeModal({ meal, tiempo, onClose, onLoadReceta, loadingReceta }) {
  const info = TIEMPO_LABELS[tiempo];
  const receta = meal?.receta;
  const [pasoActivo, setPasoActivo] = useState(null);
  const [doneSteps, setDoneSteps] = useState({});
  const [timers, setTimers] = useState({});

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(k => {
          if (next[k].running && next[k].remaining > 0) {
            next[k] = { ...next[k], remaining: next[k].remaining - 1 };
            if (next[k].remaining === 0) next[k].running = false;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const startTimer = (idx, minutos) => {
    setTimers(prev => ({ ...prev, [idx]: { total: minutos * 60, remaining: minutos * 60, running: true } }));
  };
  const toggleTimer = (idx) => {
    setTimers(prev => ({ ...prev, [idx]: { ...prev[idx], running: !prev[idx].running } }));
  };
  const toggleDone = (idx) => {
    setDoneSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  const timerPct = (idx) => {
    const t = timers[idx];
    if (!t) return 0;
    return Math.round(((t.total - t.remaining) / t.total) * 100);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal modal--${tiempo}`} onClick={e => e.stopPropagation()}>
        <div className="modal__handle" />
        <div className="modal__header">
          <div className="modal__header-top">
            <div className="modal__badge">
              <span className="modal__emoji">{info.emoji}</span>
              <span className="modal__kicker">{info.label}</span>
            </div>
            <button className="modal__close" onClick={onClose}>✕</button>
          </div>
          <h2 className="modal__title">{meal.nombre}</h2>
          <p className="modal__desc">{meal.descripcion}</p>
          {receta && (
            <div className="modal__meta">
              <span>⏱ {receta.tiempo_total} min</span>
              <span>👥 {receta.porciones}</span>
              <span>📊 {receta.dificultad}</span>
            </div>
          )}
        </div>

        <div className="modal__body">
          {!receta && !loadingReceta && (
            <div className="modal__cta" style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ fontSize: "14px", color: "var(--cafe-soft)", marginBottom: "16px" }}>
                ¿Quieres ver la receta paso a paso?
              </p>
              <button className="btn btn--recipe" style={{ width: "auto", padding: "12px 24px" }} onClick={onLoadReceta}>
                📋 Cargar receta completa
              </button>
            </div>
          )}

          {loadingReceta && <RecipeSkeleton />}

          {receta && (
            <>
              <section className="recipe-section">
                <h3 className="recipe-section__title"><i>🛒</i> Ingredientes</h3>
                <div className="ingredients-grid">
                  {receta.ingredientes.map((ing, i) => (
                    <div className="ingredient-row" key={i}>
                      <span className="ingredient-row__nombre">{ing.nombre}</span>
                      <span className="ingredient-row__cantidad">{ing.cantidad} {ing.unidad}</span>
                    </div>
                  ))}
                </div>
                {receta.utensilios?.length > 0 && (
                  <div className="utensilios">
                    <strong>🍳 Utensilios:</strong> {receta.utensilios.join(", ")}
                  </div>
                )}
              </section>

              <section className="recipe-section">
                <h3 className="recipe-section__title"><i>👨‍🍳</i> Preparación</h3>
                {receta.pasos.map((paso, i) => {
                  const timer = timers[i];
                  const timerDone = timer && timer.remaining === 0;
                  const done = !!doneSteps[i];
                  const active = pasoActivo === i;
                  return (
                    <div key={i} className={`paso ${active ? "paso--active" : ""} ${done ? "paso--done" : ""}`}>
                      <div className="paso__header">
                        <button className="paso__check" onClick={() => toggleDone(i)}>
                          {done ? "✓" : i + 1}
                        </button>
                        <div style={{ flex: 1 }}>
                          <p className="paso__texto" onClick={() => setPasoActivo(active ? null : i)}>
                            {paso.descripcion}
                          </p>
                          {paso.tiempo_minutos > 0 && active && (
                            <div className="paso__timer">
                              {!timer ? (
                                <button className="timer-start" onClick={() => startTimer(i, paso.tiempo_minutos)}>
                                  ▶ Cronómetro · {paso.tiempo_minutos} min
                                </button>
                              ) : (
                                <div className="timer-display">
                                  <div className="timer-display__top">
                                    <span className={`timer-count ${timerDone ? "timer-count--done" : ""}`}>
                                      {timerDone ? "¡Listo!" : formatTime(timer.remaining)}
                                    </span>
                                    <div className="timer-actions">
                                      {!timerDone && (
                                        <button className="timer-btn" onClick={() => toggleTimer(i)}>
                                          {timer.running ? "Pausar" : "Seguir"}
                                        </button>
                                      )}
                                      <button className="timer-btn" onClick={() => startTimer(i, paso.tiempo_minutos)}>↺</button>
                                    </div>
                                  </div>
                                  <div className="timer-bar">
                                    <div className="timer-bar__fill" style={{ width: `${timerPct(i)}%` }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {paso.tip && active && (
                            <div className="paso__tip"><span>💡</span> {paso.tip}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>

              {receta.valor_nutricional && (
                <section className="recipe-section">
                  <h3 className="recipe-section__title"><i>🥗</i> Nutrición por porción</h3>
                  <div className="nutri-grid">
                    {Object.entries(receta.valor_nutricional).map(([k, v]) => (
                      <div className="nutri-item" key={k}>
                        <span className="nutri-item__val">{v}</span>
                        <span className="nutri-item__key">{k}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
