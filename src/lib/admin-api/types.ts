// Hand-written from contracts/openapi.yaml (Test Insight Studio Backend API, 0.2.0-draft).
// Keep in sync with the contract; do not add fields that are not in it.

export type ErrorCode =
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "method_not_allowed"
  | "invalid_invitation"
  | "invitation_expired"
  | "invitation_revoked"
  | "invitation_started"
  | "conflict"
  | "rate_limited"
  | "not_implemented"
  | "internal_error";

export interface ErrorResponse {
  error: { code: ErrorCode; message: string };
}

export type ProjectStatus = "CREATED" | "IN_PROGRESS" | "READY";

export type RecordingProgress = "NOT_STARTED" | "UPLOAD_REQUESTED" | "VERIFIED";

export type ProjectFieldType = "text" | "long_text" | "number" | "boolean" | "date" | "select";

export interface ProjectFieldDefinition {
  /** Stable identifier (`^[a-z][a-z0-9_]*$`), used as the property name in `fields`. */
  key: string;
  /** Human-readable label for the field. */
  label: string;
  /** The type of the field. */
  fieldType: ProjectFieldType;
  /** Whether the field is required. */
  required: boolean;
  /** Allowed values for `select`; empty for every other type. */
  options: string[];
  /** Display order, ascending. */
  position: number;
}

export interface ProjectFieldList {
  items: ProjectFieldDefinition[];
}

export type ProjectFieldValue = string | number | boolean | null;

/** Keyed by `ProjectFieldDefinition.key`. `date` values are `YYYY-MM-DD` strings. */
export type ProjectFieldValues = Record<string, ProjectFieldValue>;

export type InvitationStatus = "active" | "started" | "expired" | "revoked";

/** Never contains the token or its hash. */
export interface InvitationSummary {
  id: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  startedAt: string | null;
  lastUsedAt: string | null;
}

export interface Project {
  id: string;
  name: string;
  /** The description of the project. */
  status: ProjectStatus;
  /** The description of the project. */
  fields: ProjectFieldValues;
  createdAt: string;
  readyAt: string | null;
  /** The time when the project was marked as ready, if applicable. */
  activeInvitation?: InvitationSummary | null;
}

export interface ProjectList {
  /** The list of projects. */
  items: Project[];
  /** The cursor for the next page of results, if any. */
  nextCursor: string | null;
}

export interface ProjectDetails extends Project {
  /** The active invitation for the project, if any. */
  invitations: InvitationSummary[];
  /** Whether the questionnaire has been submitted. */
  questionnaireSubmitted: boolean;
  /** The questionnaire for the project, if any. */
  recordings: { camera: RecordingProgress; screen: RecordingProgress };
}

export interface CreateProjectRequest {
  /** The name of the project. */
  name: string;
  /** The values for the project's extra fields. */
  fields?: ProjectFieldValues;
}

export interface CreateInvitationRequest {
  /** 1-720, defaults to 168 on the server when omitted. */
  expiresInHours?: number;
}

export interface CreateInvitationResponse {
  /** The created invitation summary. */
  invitation: InvitationSummary;
  /** Plaintext token. Returned once; treat it like a password. */
  token: string;
}

export interface ListProjectsParams {
  /** Filter projects by status. */
  status?: ProjectStatus;
  /** Limit the number of projects returned. */
  limit?: number;
  /** The cursor for pagination. */
  cursor?: string;
}
