import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// createClient throws on empty values. Fall back to inert placeholders so that
// importing this module never breaks the app; callers check isSupabaseConfigured.
export const supabase = createClient(url || "http://localhost:54321", anonKey || "unconfigured");
