import { useEffect } from "react";
import { TIEMPO_LABELS } from "../data/catalogo";

export default function MealDetailModal({ meal, tiempo, onClose, onCambiar, onVerReceta }) {
  const info = TIEMPO_LABELS[tiempo];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="meal-detail" onClick={e => e.stopPropagation()}>
        <div className="meal-detail__handle" />

        {/* Hero image */}
        <div className={`meal-detail__hero meal-detail__hero--${tiempo}`}>
          {meal.imagen ? (
            <img src={meal.imagen} alt={meal.nombre} className="meal-detail__img" />
          ) : (
            <div className={`meal-detail__img-ph meal-detail__img-ph--${tiempo}`}>
              <span>{info.emoji}</span>
            </div>
          )}
          <div className="meal-detail__hero-bar">
            <button className="meal-detail__back" onClick={onClose} aria-label="Cerrar">
              ←
            </button>
            <div className="meal-detail__hero-info">
              <span className="meal-detail__hero-kicker">{info.emoji} {info.label}</span>
              <span className="meal-detail__hero-hora">{info.hora}</span>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="meal-detail__body">
          <h2 className="meal-detail__name">{meal.nombre}</h2>
          <p className="meal-detail__desc">{meal.descripcion}</p>

          <div className="meal-detail__tags">
            {meal.saludable && <span className="tag tag--green">✓ Saludable</span>}
            {meal.economico && <span className="tag tag--gold">$ Económico</span>}
            {meal.rapido && <span className="tag tag--blue">⚡ Rápido</span>}
          </div>

          {meal.ingredientes?.length > 0 && (
            <div className="meal-detail__section">
              <div className="meal-detail__section-title">🧺 Necesitas</div>
              <div className="meal-detail__chips">
                {meal.ingredientes.map((ing, i) => (
                  <span key={i} className="meal-detail__chip">{ing}</span>
                ))}
              </div>
            </div>
          )}

          {meal.tip && (
            <div className="meal-detail__tip">
              <span>💡</span> {meal.tip}
            </div>
          )}

          {meal.fallback && (
            <div className="meal-card__fallback">
              <span>⚠ Sugerencia sin conexión</span>
              <button className="meal-card__retry" onClick={onCambiar}>
                Reintentar IA
              </button>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="meal-detail__actions">
          <button className="btn btn--recipe" onClick={onVerReceta}>
            📋 Ver receta
          </button>
          <button className="btn btn--secondary" onClick={onCambiar}>
            ↻ Cambiar
          </button>
        </div>
      </div>
    </div>
  );
}
