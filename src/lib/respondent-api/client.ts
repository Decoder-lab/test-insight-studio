import { invokeFunction, type FunctionResponse } from "@/lib/supabase";
import { RespondentApiError } from "./errors";
import type { ErrorCode, QuestionnaireAnswers, QuestionnaireReceipt, RespondentProject } from "./types";

const API = "respondent-api";

/** Header that carries the invitation token (contract: `invitationToken` security scheme). */
const TOKEN_HEADER = "X-Invitation-Token";

/**
 * Reads the ErrorResponse envelope, if the body is one. The platform gateway's own errors are not.
 * @param body The response body to inspect.
 * @returns The error code if the body is an envelope, otherwise null.
 */
function readCode(body: unknown): ErrorCode | null {
  const error = (body as { error?: { code?: unknown; message?: unknown } } | null)?.error;
  return error && typeof error.code === "string" && typeof error.message === "string" ? (error.code as ErrorCode) : null;
}

/**
 * Converts a function response into a RespondentApiError. Branches on `error.code`, never on a message.
 * @param response The failed function response to convert.
 * @returns The corresponding RespondentApiError.
 */
function toError({ status, body }: FunctionResponse): RespondentApiError {
  const code = readCode(body);

  if (status === 0) return new RespondentApiError("network", 0);
  if (code === "invalid_invitation" || status === 401) return new RespondentApiError("invalid", status, code ?? undefined);
  if (code === "invitation_expired") return new RespondentApiError("expired", status, code);
  if (code === "invitation_revoked") return new RespondentApiError("revoked", status, code);
  if (code === "invitation_started") return new RespondentApiError("started", status, code);
  if (status === 429 || code === "rate_limited") return new RespondentApiError("rate_limited", status, code ?? undefined);
  if (code === "validation_error") return new RespondentApiError("validation", status, code);
  if (code === "conflict") return new RespondentApiError("conflict", status, code);
  if (status === 501 || code === "not_implemented") return new RespondentApiError("not_ready", status, code ?? undefined);
  // No envelope means the platform answered, not our function: it is not deployed (404) or not up (502-504).
  if (!code && [404, 502, 503, 504].includes(status)) return new RespondentApiError("not_ready", status);
  return new RespondentApiError("unexpected", status, code ?? undefined);
}

const isObject = (body: unknown): body is Record<string, unknown> => typeof body === "object" && body !== null;

/**
 * Checks that a success body has the parts of `RespondentProject` that the UI relies on.
 * @param body The response body to check.
 * @returns True if the body looks like a RespondentProject.
 */
function isRespondentProject(body: unknown): body is RespondentProject {
  if (!isObject(body) || typeof body.id !== "string" || typeof body.name !== "string" || typeof body.status !== "string") {
    return false;
  }
  const { limits, progress } = body;
  if (
    !isObject(limits) ||
    typeof limits.maxDurationSeconds !== "number" ||
    typeof limits.maxSizeBytes !== "number" ||
    !Array.isArray(limits.allowedContentTypes)
  ) {
    return false;
  }
  return (
    isObject(progress) &&
    typeof progress.questionnaireSubmitted === "boolean" &&
    isObject(progress.recordings) &&
    typeof progress.recordings.camera === "string" &&
    typeof progress.recordings.screen === "string"
  );
}

const isReceipt = (body: unknown): body is QuestionnaireReceipt => isObject(body) && typeof body.submittedAt === "string";

const isSuccess = (status: number) => status >= 200 && status < 300;

/**
 * The respondent API client. The invitation token is a password: it is only ever passed
 * through to the request header, never stored, logged or put in a URL.
 */
export const respondentApi = {
  /**
   * Validates the invitation and returns the project the respondent may see.
   * Safe to call repeatedly while the invitation is active.
   * @param token The invitation token from the link's `#invite=` fragment.
   * @returns The project information the respondent is allowed to see.
   */
  async validateInvitation(token: string): Promise<RespondentProject> {
    const response = await invokeFunction({
      method: "POST",
      path: `${API}/invitation/validate`,
      headers: { [TOKEN_HEADER]: token },
    });

    if (isSuccess(response.status)) {
      if (!isRespondentProject(response.body)) throw new RespondentApiError("unexpected", response.status);
      return response.body;
    }
    throw toError(response);
  },

  /**
   * Submits (or replaces) the questionnaire answers. Idempotent, allowed until the project is completed.
   * @param token The invitation token held in memory by the caller.
   * @param answers The answers to store; they replace any earlier submission as a whole.
   * @returns The receipt with the time the backend stored the answers.
   */
  async submitQuestionnaire(token: string, answers: QuestionnaireAnswers): Promise<QuestionnaireReceipt> {
    const response = await invokeFunction({
      method: "PUT",
      path: `${API}/questionnaire-response`,
      headers: { [TOKEN_HEADER]: token },
      body: { answers },
    });

    if (isSuccess(response.status)) {
      if (!isReceipt(response.body)) throw new RespondentApiError("unexpected", response.status);
      return response.body;
    }
    throw toError(response);
  },
};
