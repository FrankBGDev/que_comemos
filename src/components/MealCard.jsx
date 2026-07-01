import { TIEMPO_LABELS } from "../data/catalogo";

function MealCardSkeleton({ tiempo }) {
  const info = TIEMPO_LABELS[tiempo];
  return (
    <div className={`meal-card meal-card--${tiempo}`}>
      <div className="meal-card__header">
        <span className="meal-card__emoji">{info.emoji}</span>
        <div>
          <h2 className="meal-card__title">{info.label}</h2>
          <span className="meal-card__hora">{info.hora}</span>
        </div>
      </div>
      <div className="meal-card__content">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--line" style={{ width: "92%" }} />
        <div className="skeleton skeleton--line" style={{ width: "78%", marginBottom: "16px" }} />
        <div className="skeleton-row">
          <div className="skeleton skeleton--chip" />
          <div className="skeleton skeleton--chip" style={{ width: "60px" }} />
        </div>
      </div>
    </div>
  );
}

export default function MealCard({ tiempo, meal, loading, onGenerate, contexto, onVerReceta }) {
  const info = TIEMPO_LABELS[tiempo];

  if (loading && !meal) return <MealCardSkeleton tiempo={tiempo} />;

  return (
    <div className={`meal-card meal-card--${tiempo}`}>

      {/* Imagen del plato si ya cargó — encima del header de acento */}
      {meal?.imagen && (
        <div className="meal-card__img-wrap">
          <img src={meal.imagen} alt={meal?.nombre} className="meal-card__img" />
        </div>
      )}

      {/* Header de acento (siempre visible) */}
      <div className="meal-card__header">
        <span className="meal-card__emoji">{info.emoji}</span>
        <div>
          <h2 className="meal-card__title">{info.label}</h2>
          <span className="meal-card__hora">{info.hora}</span>
        </div>
        <span className="meal-card__sub">{info.sub}</span>
      </div>

      {/* Contenido: plato sugerido o estado vacío */}
      {meal ? (
        <div className="meal-card__content">
          <h3 className="meal-card__name">{meal.nombre}</h3>
          <p className="meal-card__desc">{meal.descripcion}</p>
          <div className="meal-card__tags">
            {meal.saludable && <span className="tag tag--green">✓ Saludable</span>}
            {meal.economico && <span className="tag tag--gold">$ Económico</span>}
            {meal.rapido && <span className="tag tag--blue">⚡ Rápido</span>}
          </div>
          <div className="meal-card__ingredientes">
            <strong>Necesitas</strong>
            <ul>
              {meal.ingredientes?.map((ing, i) => <li key={i}>{ing}</li>)}
            </ul>
          </div>
          {meal.tip && (
            <div className="meal-card__tip"><span>💡</span> {meal.tip}</div>
          )}
          {meal.fallback && (
            <div className="meal-card__fallback">
              <span>⚠ Sugerencia sin conexión</span>
              <button className="meal-card__retry" onClick={() => onGenerate(tiempo, contexto)} disabled={loading}>
                Reintentar
              </button>
            </div>
          )}
          <div className="meal-card__actions">
            <button className="btn btn--recipe" onClick={() => onVerReceta(tiempo)}>
              Ver receta
            </button>
            <button className="btn btn--secondary" onClick={() => onGenerate(tiempo, contexto)} disabled={loading}>
              ↻ Otra
            </button>
          </div>
        </div>
      ) : (
        <div className="meal-card__empty">
          <p>¿Qué vas a {tiempo === "desayuno" ? "desayunar" : tiempo === "almuerzo" ? "almorzar" : "cenar"} hoy?</p>
          <button className="btn btn--primary" onClick={() => onGenerate(tiempo, contexto)} disabled={loading}>
            Sugerir {info.label}
          </button>
        </div>
      )}
    </div>
  );
}
