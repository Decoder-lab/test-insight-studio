import type { ErrorCode } from "./types";

/**
 * Kinds of errors that can occur when interacting with the admin API.
 */
export type AdminApiErrorKind =
  | "unauthorized" // 401: session missing or rejected
  | "forbidden" // 403: signed in, but not an administrator
  | "not_ready" // 501, or the platform answering for a function that is not deployed
  | "network" // no response at all (offline, CORS, DNS)
  | "api" // the backend's ErrorResponse envelope; branch on `code`
  | "unexpected"; // anything else, including a malformed success body

/**
 * Represents an error returned by the admin API.
 */
export class AdminApiError extends Error {
  /** The kind of error that occurred. */
  readonly kind: AdminApiErrorKind;
  /** The HTTP status code returned by the server. */
  readonly status: number;
  /** From the ErrorResponse envelope. Branch on this, never on a message. */
  readonly code?: ErrorCode;
  /** The envelope's `message`. Only ever displayed for `validation_error`; see describeError. */
  readonly serverMessage?: string;

  constructor(kind: AdminApiErrorKind, status: number, code?: ErrorCode, serverMessage?: string) {
    super(`Admin API request failed (${kind})`);
    this.name = "AdminApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.serverMessage = serverMessage;
  }
}

/**
 * Checks if the given error is an instance of AdminApiError.
 * @param error The error object to check.
 * @returns True if the error is an instance of AdminApiError.
 */
export const isAdminApiError = (error: unknown): error is AdminApiError => error instanceof AdminApiError;

/** 
 * Checks if the given error is an envelope error with the specified code.
 * @param error The error object to check.
 * @param code The error code to match.
 * @returns True for an envelope error with the given code, e.g. `hasCode(error, "not_found")`.
 */
export const hasCode = (error: unknown, code: ErrorCode) =>
  isAdminApiError(error) && error.kind === "api" && error.code === code;

/**
 * Short, user-facing text. `overrides` replaces the wording for specific envelope codes
 * (for example `conflict` on an action where it has a precise meaning). The server's
 * `message` is shown for `validation_error` only, as the contract's plain fallback line.
 * @param error The error object to describe.
 * @param overrides Action-specific wording for envelope error codes.
 * @returns A short, user-facing description of the error.
 */
export function describeError(error: unknown, overrides: Partial<Record<ErrorCode, string>> = {}): string {
  if (!isAdminApiError(error)) return "Something went wrong. Please try again.";

  switch (error.kind) {
    case "unauthorized":
      return "Your session has expired. Please sign in again.";
    case "forbidden":
      return "Your account is not an administrator.";
    case "not_ready":
      return "The backend is not ready yet.";
    case "network":
      return "Could not reach the server.";
    case "unexpected":
      return "Unexpected response from the server.";
    case "api": {
      const override = error.code && overrides[error.code];
      if (override) return override;
      if (error.code === "validation_error") return error.serverMessage || "Some values are not valid.";
      if (error.code === "not_found") return "Not found.";
      if (error.code === "conflict") return "This conflicts with the current state of the project.";
      return "Something went wrong on the server. Please try again.";
    }
  }
}
