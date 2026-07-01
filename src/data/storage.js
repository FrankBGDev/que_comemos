export const STORAGE_KEY = "qch:plan";
export const HISTORIAL_KEY = "qch:historial";
export const PERFIL_KEY = "qch:perfil";
export const HISTORIAL_MAX = 21; // ~7 días de desayuno/almuerzo/cena

export const PERFIL_VACIO = {
  alergias: "",
  composicion: "",
  objetivo: "",
  noQuieren: "",
  _completado: false,
  _descartado: false,
};

export const hoyISO = () => new Date().toISOString().slice(0, 10);

// Restaura el plan del día si la fecha coincide con hoy; de lo contrario devuelve null.
export function loadSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.fecha !== hoyISO()) return null;
    return data;
  } catch (e) {
    return null;
  }
}

// El historial no se reinicia al cambiar de día — acumula hasta HISTORIAL_MAX entradas.
export function loadHistorial() {
  try {
    const raw = localStorage.getItem(HISTORIAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// El perfil familiar persiste indefinidamente hasta que el usuario lo edite.
export function loadPerfil() {
  try {
    const raw = localStorage.getItem(PERFIL_KEY);
    return raw ? { ...PERFIL_VACIO, ...JSON.parse(raw) } : PERFIL_VACIO;
  } catch (e) {
    return PERFIL_VACIO;
  }
}
