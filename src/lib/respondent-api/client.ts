import { invokeFunction, uploadToSignedUrl, type FunctionRequest, type FunctionResponse } from "@/lib/supabase";
import { RespondentApiError } from "./errors";
import type {
  CompletedProject,
  ErrorCode,
  QuestionnaireAnswers,
  QuestionnaireReceipt,
  RecordingContentType,
  RecordingKind,
  RespondentProject,
  UploadUrl,
  VerifiedRecording,
} from "./types";

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
  if (code === "project_incomplete") return new RespondentApiError("incomplete", status, code);
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

const isUploadUrl = (body: unknown): body is UploadUrl =>
  isObject(body) &&
  typeof body.bucket === "string" &&
  typeof body.path === "string" &&
  typeof body.token === "string" &&
  typeof body.signedUrl === "string" &&
  typeof body.maxSizeBytes === "number" &&
  typeof body.maxDurationSeconds === "number";

const isVerifiedRecording = (body: unknown): body is VerifiedRecording =>
  isObject(body) &&
  typeof body.kind === "string" &&
  typeof body.status === "string" &&
  typeof body.sizeBytes === "number" &&
  typeof body.contentType === "string";

const isCompletedProject = (body: unknown): body is CompletedProject =>
  isObject(body) && body.status === "READY" && typeof body.readyAt === "string";

const isSuccess = (status: number) => status >= 200 && status < 300;

/**
 * Sends a request that must answer with a body `isExpected` accepts.
 * @param request The function request, including the token header.
 * @param isExpected Guard for the parts of the success body that the UI relies on.
 * @returns The success body.
 */
async function call<T>(request: FunctionRequest, isExpected: (body: unknown) => body is T): Promise<T> {
  const response = await invokeFunction(request);

  if (isSuccess(response.status)) {
    if (!isExpected(response.body)) throw new RespondentApiError("unexpected", response.status);
    return response.body;
  }
  throw toError(response);
}

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

  /**
   * Asks for permission to upload one recording. A new request for the same kind replaces an
   * unverified earlier attempt, but answers `409` once that recording is verified.
   * @param token The invitation token held in memory by the caller.
   * @param kind Which recording the upload is for.
   * @param contentType The bare MIME type of the file (no codec parameters), so Storage's allow-list matches.
   * @returns The Storage path and the signed upload token. Secrets: use them for the upload only.
   */
  createUploadUrl(token: string, kind: RecordingKind, contentType: RecordingContentType): Promise<UploadUrl> {
    return call(
      {
        method: "POST",
        path: `${API}/recordings/${kind}/upload-url`,
        headers: { [TOKEN_HEADER]: token },
        body: { contentType },
      },
      isUploadUrl,
    );
  },

  /**
   * Sends a recording straight to Storage with the signed upload permission.
   * @param target The permission returned by `createUploadUrl`.
   * @param blob The recording. Its type must be the bare MIME type.
   * @param contentType The same bare MIME type.
   */
  async uploadRecording(target: UploadUrl, blob: Blob, contentType: RecordingContentType): Promise<void> {
    const result = await uploadToSignedUrl({ bucket: target.bucket, path: target.path, token: target.token, blob, contentType });
    if (!result.ok) throw new RespondentApiError("upload", result.status);
  },

  /**
   * Tells the backend that the upload finished, so it can check the stored object. Idempotent.
   * @param token The invitation token held in memory by the caller.
   * @param kind Which recording was uploaded.
   * @param durationMs Duration measured by the client, an integer from 1 to 120000.
   * @returns What the backend found in Storage.
   */
  verifyRecording(token: string, kind: RecordingKind, durationMs: number): Promise<VerifiedRecording> {
    return call(
      {
        method: "POST",
        path: `${API}/recordings/${kind}/verify`,
        headers: { [TOKEN_HEADER]: token },
        body: { durationMs },
      },
      isVerifiedRecording,
    );
  },

  /**
   * Completes the project once the questionnaire is stored and the required recordings are verified.
   * Idempotent.
   * @param token The invitation token held in memory by the caller.
   * @returns When the project became READY.
   */
  completeProject(token: string): Promise<CompletedProject> {
    return call({ method: "POST", path: `${API}/complete`, headers: { [TOKEN_HEADER]: token } }, isCompletedProject);
  },
};
