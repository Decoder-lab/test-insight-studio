import { beforeEach, describe, expect, it, vi } from "vitest";

const lib = vi.hoisted(() => ({ invokeFunction: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ invokeFunction: lib.invokeFunction }));

import { respondentApi } from "./client";
import { RespondentApiError, describeRespondentError, isRetryable } from "./errors";

const TOKEN = "SECRET-TOKEN";

const project = () => ({
  id: "p1",
  name: "Pilot test",
  status: "READY",
  limits: { maxDurationSeconds: 120, maxSizeBytes: 52428800, allowedContentTypes: ["video/webm"] },
  progress: { questionnaireSubmitted: false, recordings: { camera: "NOT_STARTED", screen: "NOT_STARTED" } },
});

const envelope = (code: string, message = "server text") => ({ error: { code, message } });
const respond = (status: number, body: unknown = null) => lib.invokeFunction.mockResolvedValueOnce({ status, body });

const failure = async () => {
  const error = await respondentApi.validateInvitation(TOKEN).then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(RespondentApiError);
  return error as RespondentApiError;
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("validateInvitation", () => {
  it("posts to the contract's path with the token in the header, not in the URL or body", async () => {
    respond(200, project());

    await expect(respondentApi.validateInvitation(TOKEN)).resolves.toEqual(project());

    expect(lib.invokeFunction).toHaveBeenCalledWith({
      method: "POST",
      path: "respondent-api/invitation/validate",
      headers: { "X-Invitation-Token": TOKEN },
    });
  });

  it("treats a malformed success body as unexpected", async () => {
    respond(200, { id: "p1", name: "Pilot test" });

    expect((await failure()).kind).toBe("unexpected");
  });

  it("treats an empty success body as unexpected", async () => {
    respond(200, null);

    expect((await failure()).kind).toBe("unexpected");
  });
});

describe("errors", () => {
  it.each([
    [401, envelope("invalid_invitation"), "invalid"],
    [410, envelope("invitation_expired"), "expired"],
    [410, envelope("invitation_revoked"), "revoked"],
    [410, envelope("invitation_started"), "started"],
    [429, envelope("rate_limited"), "rate_limited"],
    [429, null, "rate_limited"],
    [503, envelope("rate_limited"), "rate_limited"],
    [501, envelope("not_implemented"), "not_ready"],
    [404, null, "not_ready"],
    [503, null, "not_ready"],
    [500, envelope("internal_error"), "unexpected"],
    [418, null, "unexpected"],
  ])("maps status %d with %j to %s", async (status, body, kind) => {
    respond(status, body);

    const error = await failure();

    expect(error.kind).toBe(kind);
    expect(error.status).toBe(status);
  });

  it("reports a request that got no response as a network error", async () => {
    respond(0);

    expect((await failure()).kind).toBe("network");
  });

  it("branches on the envelope's code, never on its message", async () => {
    respond(410, envelope("invitation_expired", "this link was REVOKED"));

    expect((await failure()).kind).toBe("expired");
  });

  it("keeps a real 404 from the function (with an envelope) apart from an undeployed function", async () => {
    respond(404, envelope("not_found"));

    expect((await failure()).kind).toBe("unexpected");
  });
});

describe("describeRespondentError", () => {
  it("never shows the server's message or the token", async () => {
    respond(401, envelope("invalid_invitation", `unknown token ${TOKEN}`));

    const text = describeRespondentError(await failure());

    expect(text).toContain("isn't valid");
    expect(text).not.toContain(TOKEN);
  });

  it("offers a retry only where trying again can help", () => {
    expect(isRetryable(new RespondentApiError("network", 0))).toBe(true);
    expect(isRetryable(new RespondentApiError("rate_limited", 429))).toBe(true);
    expect(isRetryable(new RespondentApiError("unexpected", 500))).toBe(true);
    expect(isRetryable(new RespondentApiError("invalid", 401))).toBe(false);
    expect(isRetryable(new RespondentApiError("expired", 410))).toBe(false);
    expect(isRetryable(new RespondentApiError("revoked", 410))).toBe(false);
    expect(isRetryable(new RespondentApiError("started", 410))).toBe(false);
    expect(isRetryable(new RespondentApiError("not_ready", 501))).toBe(false);
  });
});
