import { useState } from "react";

export const PERFIL_COMPOSICION = ["Niños pequeños", "Adultos mayores", "Ambos", "Ninguno"];
export const PERFIL_OBJETIVOS = ["Comer más sano", "Ahorrar al máximo", "Variar y no aburrirse", "Un poco de todo"];

export default function PerfilScreen({ perfil, onSave, onBack }) {
  const [form, setForm] = useState(perfil);

  return (
    <div className="perfil-screen">
      <div className="perfil-screen__header">
        <button className="perfil-screen__back" onClick={onBack}>← Volver</button>
        <h2 className="perfil-screen__title">Perfil familiar</h2>
        <p className="perfil-screen__hint">Esto se guarda una sola vez — lo usamos para afinar cada sugerencia.</p>
      </div>

      <div className="perfil-screen__body">
        <div className="config-item">
          <label>¿Alguien en casa tiene alergias o debe evitar algún ingrediente por completo?</label>
          <textarea
            className="perfil-textarea"
            placeholder="Ej: camarones, frutos secos..."
            value={form.alergias}
            onChange={e => setForm(f => ({ ...f, alergias: e.target.value }))}
          />
        </div>

        <div className="config-item">
          <label>¿Hay niños pequeños o adultos mayores en casa?</label>
          <div className="config-options">
            {PERFIL_COMPOSICION.map(opt => (
              <button
                key={opt}
                className={`config-btn ${form.composicion === opt ? "config-btn--active" : ""}`}
                onClick={() => setForm(f => ({ ...f, composicion: opt }))}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="config-item">
          <label>¿Cuál es el objetivo principal de la familia con la comida?</label>
          <div className="config-options">
            {PERFIL_OBJETIVOS.map(opt => (
              <button
                key={opt}
                className={`config-btn ${form.objetivo === opt ? "config-btn--active" : ""}`}
                onClick={() => setForm(f => ({ ...f, objetivo: opt }))}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="config-item">
          <label>¿Hay algún plato o ingrediente que definitivamente no quieren volver a ver?</label>
          <textarea
            className="perfil-textarea"
            placeholder="Ej: hígado, berenjena..."
            value={form.noQuieren}
            onChange={e => setForm(f => ({ ...f, noQuieren: e.target.value }))}
          />
        </div>
      </div>

      <div className="perfil-screen__actions">
        <button className="btn btn--primary" onClick={() => onSave(form)}>Guardar perfil</button>
        <button className="btn btn--secondary" onClick={onBack}>Volver sin guardar</button>
      </div>
    </div>
  );
}
