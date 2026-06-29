import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// createClient lanza una excepción de inmediato si faltan estos valores — antes de
// que exista un proyecto de Supabase configurado, evitamos tumbar toda la app.
export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured ? createClient(url, anonKey) : null;
