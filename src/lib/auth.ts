import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type { Session, User } from "@supabase/supabase-js";

export type SignInError = "invalid_credentials" | "rate_limited" | "unknown";

export const DEFAULT_REDIRECT = "/admin";

// Routes that would bounce a signed-in user straight back (or sign them out again).
const AUTH_ROUTE = /^\/(login|logout|auth)(?:[/?#]|$)/;

// Browsers strip tabs/newlines from URLs, so "/\t/evil.com" would become "//evil.com".
const hasControlChars = (value: string) =>
  Array.from(value).some((char) => char.charCodeAt(0) <= 0x1f || char.charCodeAt(0) === 0x7f);

/**
 * Returns `raw` only if it is a safe internal return path; otherwise `fallback`.
 * Rejects absolute and protocol-relative URLs (`//host`, `/\host`) and auth routes.
 */
export function safeRedirectPath(raw: unknown, fallback = DEFAULT_REDIRECT): string {
  if (typeof raw !== "string") return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw.includes("\\") || hasControlChars(raw)) return fallback;
  if (AUTH_ROUTE.test(raw)) return fallback;
  return raw;
}

/** Extracts the return path ProtectedRoute stores in `location.state.from`. */
export function redirectTargetFromState(state: unknown, fallback = DEFAULT_REDIRECT): string {
  const from = (state as { from?: { pathname?: unknown; search?: unknown; hash?: unknown } } | null)?.from;
  if (!from || typeof from.pathname !== "string") return fallback;
  const search = typeof from.search === "string" ? from.search : "";
  const hash = typeof from.hash === "string" ? from.hash : "";
  return safeRedirectPath(from.pathname + search + hash, fallback);
}

export async function signInWithPassword(email: string, password: string): Promise<SignInError | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) return null;
  if (error.code === "invalid_credentials") return "invalid_credentials";
  if (error.status === 429) return "rate_limited";
  return "unknown";
}

/** Clears the local session. supabase-js does so even if revoking it on the server fails (e.g. offline). */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Subscribes to auth changes; returns an unsubscribe function. */
export function onAuthChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
