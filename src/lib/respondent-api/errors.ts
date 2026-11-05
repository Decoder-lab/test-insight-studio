import type { ErrorCode } from "./types";

/**
 * Kinds of errors that can occur when a respondent opens an invitation link.
 */
export type RespondentApiErrorKind =
  | "invalid" // 401 invalid_invitation: missing or unknown token
  | "expired" // 410 invitation_expired
  | "revoked" // 410 invitation_revoked
  | "started" // 410 invitation_started: the test was already started, so the link no longer opens
  | "rate_limited" // 429 rate_limited
  | "validation" // 400 validation_error: the backend rejected the submitted answers
  | "conflict" // 409 conflict: the project no longer accepts changes (e.g. already completed)
  | "upload" // Storage did not accept the recording (or did not answer)
  | "incomplete" // 409 project_incomplete: the questionnaire or a required recording has not arrived
  | "not_ready" // 501, or the platform answering for a function that is not deployed
  | "network" // no response at all (offline, CORS, DNS)
  | "unexpected"; // anything else, including a malformed success body

/**
 * Represents an error returned by the respondent API.
 */
export class RespondentApiError extends Error {
  readonly kind: RespondentApiErrorKind;
  /** The HTTP status code returned by the server; 0 when there was no response. */
  readonly status: number;
  /** From the ErrorResponse envelope. Branch on this, never on a message. */
  readonly code?: ErrorCode;

  constructor(kind: RespondentApiErrorKind, status: number, code?: ErrorCode) {
    super(`Respondent API request failed (${kind})`);
    this.name = "RespondentApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
  }
}

/**
 * Checks if the given error is an instance of RespondentApiError.
 * @param error The error object to check.
 * @returns True if the error is an instance of RespondentApiError.
 */
export const isRespondentApiError = (error: unknown): error is RespondentApiError => error instanceof RespondentApiError;

/** Whether trying again can help, as opposed to a link that will never open. */
export const isRetryable = (error: unknown): boolean =>
  !isRespondentApiError(error) || ["rate_limited", "network", "unexpected", "upload"].includes(error.kind);

/**
 * Short, respondent-facing text for an error. The server's message is never shown.
 * @param error The error object to describe.
 * @returns A short description suitable for the respondent.
 */
export function describeRespondentError(error: unknown): string {
  if (!isRespondentApiError(error)) return "Something went wrong. Please try again.";

  switch (error.kind) {
    case "invalid":
      return "This invitation link isn't valid. Please check that you opened the full link from your invitation.";
    case "expired":
      return "This invitation link has expired. Please ask the research team for a new one.";
    case "revoked":
      return "This invitation link has been withdrawn. Please contact the research team.";
    case "started":
      return "This test has already been started, so this link can't be opened again. Please contact the research team if you need help.";
    case "rate_limited":
      return "Too many attempts. Please wait a moment and try again.";
    case "validation":
      return "Something you sent could not be accepted. Please check it and try again.";
    case "conflict":
      return "This test can no longer be changed. Please contact the research team if you need help.";
    case "incomplete":
      return "A part of the test has not been received yet, so it can't be finished. Please contact the research team if you need help.";
    case "upload":
      return "The recording could not be uploaded. Please check your connection and try again.";
    case "not_ready":
      return "The test service isn't available yet. Please try again later.";
    case "network":
      return "Could not reach the server. Please check your connection and try again.";
    case "unexpected":
      return "Unexpected response from the server. Please try again.";
  }
}
