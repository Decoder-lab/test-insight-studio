import { vi } from "vitest";
import type { AuthContextValue } from "@/components/auth/auth-context";
import type { Session } from "@/lib/auth";

export const fakeSession = {
  access_token: "token",
  user: { id: "user-1", email: "admin@example.com" },
} as unknown as Session;

/** Signed-out, loaded, configured auth state; override fields per test. */
export function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    session: null,
    user: null,
    loading: false,
    configured: true,
    signIn: vi.fn().mockResolvedValue(null),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
