import { beforeEach, describe, expect, it, vi } from "vitest";

const authApi = vi.hoisted(() => ({ signInWithPassword: vi.fn() }));
vi.mock("./supabase", () => ({ supabase: { auth: authApi }, isSupabaseConfigured: true }));

import { redirectTargetFromState, safeRedirectPath, signInWithPassword } from "./auth";

describe("safeRedirectPath", () => {
  it("keeps internal paths including query and hash", () => {
    expect(safeRedirectPath("/admin/users?page=2#top")).toBe("/admin/users?page=2#top");
    expect(safeRedirectPath("/test?invite=abc")).toBe("/test?invite=abc");
  });

  it.each([
    ["protocol-relative URL", "//evil.com"],
    ["backslash host", "/\\evil.com"],
    ["backslash later in path", "/admin\\..\\evil"],
    ["absolute URL", "https://evil.com/admin"],
    ["javascript URL", "javascript:alert(1)"],
    ["relative path", "admin"],
    ["control character", "/\t/evil.com"],
    ["login route", "/login"],
    ["logout route", "/logout"],
    ["auth callback", "/auth/callback?code=1"],
    ["empty string", ""],
  ])("falls back for %s", (_label, input) => {
    expect(safeRedirectPath(input)).toBe("/admin");
  });

  it("falls back for non-strings and honours a custom fallback", () => {
    expect(safeRedirectPath(undefined)).toBe("/admin");
    expect(safeRedirectPath(42, "/home")).toBe("/home");
  });

  it("does not treat similarly named routes as auth routes", () => {
    expect(safeRedirectPath("/login-help")).toBe("/login-help");
  });
});

describe("redirectTargetFromState", () => {
  it("rebuilds the path from a router location", () => {
    expect(redirectTargetFromState({ from: { pathname: "/admin/x", search: "?y=1", hash: "#z" } })).toBe(
      "/admin/x?y=1#z",
    );
  });

  it("falls back for missing or unsafe state", () => {
    expect(redirectTargetFromState(null)).toBe("/admin");
    expect(redirectTargetFromState({})).toBe("/admin");
    expect(redirectTargetFromState({ from: { pathname: "//evil.com" } })).toBe("/admin");
    expect(redirectTargetFromState({ from: { pathname: "/login" } })).toBe("/admin");
  });
});

describe("signInWithPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes credentials through and returns null on success", async () => {
    authApi.signInWithPassword.mockResolvedValue({ error: null });
    await expect(signInWithPassword("a@b.co", "pw")).resolves.toBeNull();
    expect(authApi.signInWithPassword).toHaveBeenCalledWith({ email: "a@b.co", password: "pw" });
  });

  it.each([
    ["bad credentials", { code: "invalid_credentials", status: 400 }, "invalid_credentials"],
    ["rate limit", { code: "over_request_rate_limit", status: 429 }, "rate_limited"],
    ["anything else", { status: 500 }, "unknown"],
  ])("maps %s", async (_label, error, expected) => {
    authApi.signInWithPassword.mockResolvedValue({ error });
    await expect(signInWithPassword("a@b.co", "pw")).resolves.toBe(expected);
  });
});
