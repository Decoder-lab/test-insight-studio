import { createClient, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// createClient throws on empty values. Fall back to inert placeholders so that
// importing this module never breaks the app; callers check isSupabaseConfigured.
export const supabase = createClient(url || "http://localhost:54321", anonKey || "unconfigured");

export interface SignedUpload {
  bucket: string;
  path: string;
  /** Signed upload token from the backend. A secret: never log it. */
  token: string;
  /** Its type must be the bare MIME type: supabase-js sends a Blob as multipart with the Blob's own type. */
  blob: Blob;
  contentType: string;
}

export interface UploadResult {
  ok: boolean;
  /** HTTP status of Storage's answer, or 0 when there was none (offline, CORS, DNS). */
  status: number;
}

/**
 * Uploads a file to Storage with a signed upload token (no session needed). Never rejects: a
 * failure is reported through `ok` and `status`.
 */
export async function uploadToSignedUrl({ bucket, path, token, blob, contentType }: SignedUpload): Promise<UploadResult> {
  try {
    const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, blob, { contentType });
    if (!error) return { ok: true, status: 200 };
    return { ok: false, status: "status" in error && typeof error.status === "number" ? error.status : 0 };
  } catch {
    return { ok: false, status: 0 };
  }
}

export interface FunctionRequest {
  method: "GET" | "POST" | "PUT";
  /** Function name plus sub-path and query, e.g. `admin-api/projects?limit=25`. */
  path: string;
  body?: unknown;
  /** Extra request headers, e.g. `X-Invitation-Token` for the respondent API. */
  headers?: Record<string, string>;
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
export async function invokeFunction({ method, path, body, headers }: FunctionRequest): Promise<FunctionResponse> {
  const { data, error, response } = await supabase.functions.invoke(path, { method, body, headers });
  if (!error) return { status: response?.status ?? 200, body: data };

  if (error instanceof FunctionsHttpError || error instanceof FunctionsRelayError) {
    const failed = error.context as Response;
    return { status: failed.status, body: await failed.json().catch(() => null) };
  }
  return { status: 0, body: null };
}
