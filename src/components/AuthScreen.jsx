import { useState } from "react";
import { supabase } from "../supabaseClient";

function traducirErrorAuth(msg) {
  const m = (msg || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (m.includes("already registered") || m.includes("already exists")) return "Ya existe una cuenta con este correo.";
  if (m.includes("email not confirmed")) return "Debes confirmar tu correo antes de entrar — revisa tu bandeja de entrada.";
  if (m.includes("password should be at least") || m.includes("at least 6 characters")) return "La contraseña debe tener al menos 6 caracteres.";
  if (m.includes("rate limit")) return "Demasiados intentos. Espera un momento y vuelve a intentar.";
  return msg || "Ocurrió un error. Intenta de nuevo.";
}

export default function AuthScreen() {
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Cuenta creada. Si tu correo necesita confirmación, revísalo antes de entrar.");
      }
    } catch (err) {
      setError(traducirErrorAuth(err.message));
    } finally {
      setLoading(false);
    }
  };

  const recuperar = async () => {
    if (!email) { setError("Escribe tu correo arriba primero."); return; }
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setInfo("Te enviamos un correo para restablecer tu contraseña.");
    } catch (err) {
      setError(traducirErrorAuth(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-screen__brand">
        <h1 className="header__title">¿Qué comemos<br />hoy?</h1>
        <p className="auth-screen__tag">Tu menú familiar, donde sea que entres.</p>
      </div>

      <form className="auth-card" onSubmit={submit}>
        <h2 className="auth-card__title">{modo === "login" ? "Inicia sesión" : "Crea tu cuenta"}</h2>

        <div className="config-item">
          <label>Correo</label>
          <input className="auth-input" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" />
        </div>
        <div className="config-item">
          <label>Contraseña</label>
          <input className="auth-input" type="password" required minLength={6} autoComplete={modo === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
        </div>

        {error && <p className="auth-error">{error}</p>}
        {info && <p className="auth-info">{info}</p>}

        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? "Un momento..." : modo === "login" ? "Entrar" : "Crear cuenta"}
        </button>

        <button type="button" className="auth-link" onClick={() => { setModo(modo === "login" ? "signup" : "login"); setError(""); setInfo(""); }}>
          {modo === "login" ? "¿No tienes cuenta? Créala" : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
        {modo === "login" && (
          <button type="button" className="auth-link" onClick={recuperar} disabled={loading}>¿Olvidaste tu contraseña?</button>
        )}
      </form>
    </div>
  );
}

export function RecoveryForm({ onDone }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      onDone();
    } catch (err) {
      setError(traducirErrorAuth(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <h2 className="auth-card__title">Define tu nueva contraseña</h2>
        <div className="config-item">
          <label>Nueva contraseña</label>
          <input className="auth-input" type="password" required minLength={6} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar nueva contraseña"}
        </button>
      </form>
    </div>
  );
}
