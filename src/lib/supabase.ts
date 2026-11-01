import { createClient, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// createClient throws on empty values. Fall back to inert placeholders so that
// importing this module never breaks the app; callers check isSupabaseConfigured.
export const supabase = createClient(url || "http://localhost:54321", anonKey || "unconfigured");

export interface FunctionRequest {
  method: "GET" | "POST";
  /** Function name plus sub-path and query, e.g. `admin-api/projects?limit=25`. */
  path: string;
  body?: unknown;
}

export interface FunctionResponse {
  /** HTTP status, or 0 when the request never got a response (offline, CORS, DNS). */
  status: number;
  /** Parsed JSON body, or null when the response had none. */
  body: unknown;
}

/**
 * Calls an Edge Function with the current session. supabase-js adds `apikey` and
 * `Authorization: Bearer <access_token>`. Never rejects: HTTP errors and network
 * failures are reported through `status`, so callers decide how to react.
 */
export async function invokeFunction({ method, path, body }: FunctionRequest): Promise<FunctionResponse> {
  const { data, error, response } = await supabase.functions.invoke(path, { method, body });
  if (!error) return { status: response?.status ?? 200, body: data };

  if (error instanceof FunctionsHttpError || error instanceof FunctionsRelayError) {
    const failed = error.context as Response;
    return { status: failed.status, body: await failed.json().catch(() => null) };
  }
  return { status: 0, body: null };
}
