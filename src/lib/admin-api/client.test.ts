import { beforeEach, describe, expect, it, vi } from "vitest";

const lib = vi.hoisted(() => ({ invokeFunction: vi.fn(), refreshSession: vi.fn(), signOut: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ invokeFunction: lib.invokeFunction }));
vi.mock("@/lib/auth", () => ({ refreshSession: lib.refreshSession, signOut: lib.signOut }));

import { adminApi } from "./client";
import { AdminApiError, describeError } from "./errors";

const envelope = (code: string, message = "server text") => ({ error: { code, message } });
const respond = (status: number, body: unknown = null) => lib.invokeFunction.mockResolvedValueOnce({ status, body });

const failure = async (call: () => Promise<unknown>) => {
  const error = await call().then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(AdminApiError);
  return error as AdminApiError;
};

beforeEach(() => {
  vi.resetAllMocks();
  lib.signOut.mockResolvedValue(undefined);
});

describe("requests", () => {
  it("lists projects with the filter, limit and cursor in the query string", async () => {
    respond(200, { items: [], nextCursor: null });

    await adminApi.listProjects({ status: "READY", limit: 10, cursor: "abc=" });

    expect(lib.invokeFunction).toHaveBeenCalledWith({
      method: "GET",
      path: "admin-api/projects?status=READY&limit=10&cursor=abc%3D",
    });
  });

  it("sends no query string when there are no parameters", async () => {
    respond(200, { items: [], nextCursor: null });
    await adminApi.listProjects();
    expect(lib.invokeFunction).toHaveBeenCalledWith({ method: "GET", path: "admin-api/projects" });
  });

  it("calls the other operations on the contract's paths", async () => {
    respond(200, { items: [] });
    respond(201, { id: "p1" });
    respond(201, { invitation: { id: "i1" }, token: "tok" });
    respond(200, { id: "i1" });

    await adminApi.listProjectFields();
    await adminApi.createProject({ name: "N", fields: { a: 1 } });
    await adminApi.createInvitation("p1", { expiresInHours: 24 });
    await adminApi.revokeInvitation("p1", "i1");

    expect(lib.invokeFunction.mock.calls.map(([request]) => request)).toEqual([
      { method: "GET", path: "admin-api/project-fields" },
      { method: "POST", path: "admin-api/projects", body: { name: "N", fields: { a: 1 } } },
      { method: "POST", path: "admin-api/projects/p1/invitations", body: { expiresInHours: 24 } },
      { method: "POST", path: "admin-api/projects/p1/invitations/i1/revoke" },
    ]);
  });

  it("returns the parsed body, including the one-time token", async () => {
    respond(201, { invitation: { id: "i1" }, token: "tok" });
    await expect(adminApi.createInvitation("p1")).resolves.toEqual({ invitation: { id: "i1" }, token: "tok" });
  });
});

describe("error mapping", () => {
  it.each([
    ["an envelope 400", 400, envelope("validation_error"), "api", "validation_error"],
    ["an envelope 404", 404, envelope("not_found"), "api", "not_found"],
    ["an envelope 409", 409, envelope("conflict"), "api", "conflict"],
    ["an envelope 500", 500, envelope("internal_error"), "api", "internal_error"],
    ["a 403 envelope", 403, envelope("forbidden"), "forbidden", "forbidden"],
    ["a 403 from the gateway", 403, { message: "nope" }, "forbidden", undefined],
    ["501 not_implemented", 501, envelope("not_implemented"), "not_ready", "not_implemented"],
    ["a 404 from the gateway (function not deployed)", 404, { code: "NOT_FOUND", message: "not found" }, "not_ready", undefined],
    ["a 404 without a body", 404, null, "not_ready", undefined],
    ["a 503 from the gateway", 503, null, "not_ready", undefined],
    ["a 500 without an envelope", 500, "<html>", "unexpected", undefined],
    ["no response at all", 0, null, "network", undefined],
  ])("maps %s", async (_label, status, body, kind, code) => {
    respond(status, body);

    const error = await failure(() => adminApi.getProject("p1"));

    expect(error.kind).toBe(kind);
    expect(error.code).toBe(code);
  });

  it("decides by the envelope's code, never by its message", async () => {
    respond(409, envelope("conflict", "The project is not found"));
    respond(404, envelope("not_found", "conflict"));

    expect((await failure(() => adminApi.getProject("p"))).code).toBe("conflict");
    expect((await failure(() => adminApi.getProject("p"))).code).toBe("not_found");
  });

  it("rejects a success body that does not match the contract instead of passing it on", async () => {
    respond(200, { nope: true });
    respond(200, "<html>");

    expect((await failure(() => adminApi.listProjects())).kind).toBe("unexpected");
    expect((await failure(() => adminApi.getProject("p1"))).kind).toBe("unexpected");
  });
});

describe("401 handling", () => {
  it("refreshes the session and retries once", async () => {
    respond(401, { code: 401, message: "Invalid JWT" });
    respond(200, { items: [] });
    lib.refreshSession.mockResolvedValue(true);

    await expect(adminApi.listProjectFields()).resolves.toEqual({ items: [] });

    expect(lib.invokeFunction).toHaveBeenCalledTimes(2);
    expect(lib.signOut).not.toHaveBeenCalled();
  });

  it("signs out when the retry is rejected too", async () => {
    respond(401, envelope("unauthorized"));
    respond(401, envelope("unauthorized"));
    lib.refreshSession.mockResolvedValue(true);

    const error = await failure(() => adminApi.listProjectFields());

    expect(error.kind).toBe("unauthorized");
    expect(lib.refreshSession).toHaveBeenCalledTimes(1);
    expect(lib.invokeFunction).toHaveBeenCalledTimes(2);
    expect(lib.signOut).toHaveBeenCalledTimes(1);
  });

  it("signs out without retrying when the session cannot be refreshed", async () => {
    respond(401, null);
    lib.refreshSession.mockResolvedValue(false);

    expect((await failure(() => adminApi.listProjectFields())).kind).toBe("unauthorized");
    expect(lib.invokeFunction).toHaveBeenCalledTimes(1);
    expect(lib.signOut).toHaveBeenCalledTimes(1);
  });

  it("does not sign out or retry on 403", async () => {
    respond(403, envelope("forbidden"));

    expect((await failure(() => adminApi.listProjectFields())).kind).toBe("forbidden");
    expect(lib.refreshSession).not.toHaveBeenCalled();
    expect(lib.signOut).not.toHaveBeenCalled();
  });
});

describe("describeError", () => {
  const api = (code: string, message: string) => new AdminApiError("api", 400, code as never, message);

  it("shows the server's message only for validation errors", () => {
    expect(describeError(api("validation_error", "fields.market: must be one of DE, FR"))).toBe(
      "fields.market: must be one of DE, FR",
    );
    expect(describeError(api("internal_error", "stack trace at line 1"))).not.toContain("stack trace");
    expect(describeError(api("conflict", "internal detail"))).not.toContain("internal detail");
  });

  it("uses action-specific wording for a code when given", () => {
    expect(describeError(api("conflict", "x"), { conflict: "Already complete." })).toBe("Already complete.");
  });

  it("has fixed wording for the other kinds", () => {
    expect(describeError(new AdminApiError("forbidden", 403))).toBe("Your account is not an administrator.");
    expect(describeError(new AdminApiError("network", 0))).toBe("Could not reach the server.");
    expect(describeError(new AdminApiError("not_ready", 501))).toMatch(/not ready/i);
    expect(describeError(new Error("boom"))).not.toContain("boom");
  });
});
