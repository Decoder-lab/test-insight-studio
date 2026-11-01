import { refreshSession, signOut } from "@/lib/auth";
import { invokeFunction, type FunctionRequest, type FunctionResponse } from "@/lib/supabase";
import { AdminApiError } from "./errors";
import type {
  CreateInvitationRequest,
  CreateInvitationResponse,
  CreateProjectRequest,
  ErrorCode,
  InvitationSummary,
  ListProjectsParams,
  Project,
  ProjectDetails,
  ProjectFieldList,
  ProjectList,
} from "./types";

const API = "admin-api";

/**
 * Sends a function request to the server, using the appropriate transport mechanism.
 * @param request The function request to send.
 * @returns The function response from the server.
 */
async function transport(request: FunctionRequest): Promise<FunctionResponse> {
  // Development only. `import.meta.env.DEV` is false in production builds, so this branch
  // and the mock module are removed from the bundle.
  if (import.meta.env.DEV && import.meta.env.VITE_ADMIN_API_MOCK) {
    const { mockTransport } = await import("./mock");
    return mockTransport(request);
  }
  return invokeFunction(request);
}

/** 
 * Reads the ErrorResponse envelope, if the body is one. The platform gateway's own errors are not.
 * @param body The response body to inspect.
 * @returns The error envelope if present, otherwise null.
 */
function readEnvelope(body: unknown): { code: ErrorCode; message: string } | null {
  const error = (body as { error?: { code?: unknown; message?: unknown } } | null)?.error;
  if (error && typeof error.code === "string" && typeof error.message === "string") {
    return { code: error.code as ErrorCode, message: error.message };
  }
  return null;
}

/**
 * Converts a function response into an AdminApiError.
 * @param response The function response to convert.
 * @returns The corresponding AdminApiError.
 */
function toError({ status, body }: FunctionResponse): AdminApiError {
  const envelope = readEnvelope(body);
  const code = envelope?.code;

  if (status === 0) return new AdminApiError("network", 0);
  if (status === 401 || code === "unauthorized") return new AdminApiError("unauthorized", status, code);
  if (status === 403 || code === "forbidden") return new AdminApiError("forbidden", status, code);
  if (status === 501 || code === "not_implemented") return new AdminApiError("not_ready", status, code);
  // No envelope means the platform answered, not our function: it is not deployed (404) or not up (502-504).
  if (!envelope && [404, 502, 503, 504].includes(status)) return new AdminApiError("not_ready", status);
  if (envelope) return new AdminApiError("api", status, envelope.code, envelope.message);
  return new AdminApiError("unexpected", status);
}

/**
 * Sends one request. On 401 the session is refreshed and the request retried once; if that
 * does not help the user is signed out, and the app's route guard sends them to /login.
 * @param request The function request to send.
 * @param isValid A function to validate the response body.
 * @param retried Internal flag to indicate if the request has been retried.
 * @returns The validated response body.
 */
async function send<T>(request: FunctionRequest, isValid: (body: unknown) => boolean, retried = false): Promise<T> {
  const response = await transport(request);

  if (response.status >= 200 && response.status < 300) {
    if (!isValid(response.body)) throw new AdminApiError("unexpected", response.status);
    return response.body as T;
  }

  const error = toError(response);
  if (error.kind === "unauthorized") {
    if (!retried && (await refreshSession())) return send<T>(request, isValid, true);
    await signOut().catch(() => undefined);
  }
  throw error;
}

/**
 * Type guard to check if a value is an object.
 * @param body The value to check.
 * @returns True if the value is a non-null object.
 */
const isObject = (body: unknown): body is Record<string, unknown> => typeof body === "object" && body !== null;
/**
 * Checks if the given body has an `items` array.
 * @param body The value to check.
 * @returns True if the body is an object with an `items` array.
 */
const hasItems = (body: unknown) => isObject(body) && Array.isArray(body.items);

/**
 * Checks if the given body has an `id` string.
 * @param body The value to check.
 * @returns True if the body is an object with an `id` string.
 */
const hasId = (body: unknown) => isObject(body) && typeof body.id === "string";

/**
 * Constructs the API path for a specific project.
 * @param projectId The ID of the project.
 * @returns The API path for the project.
 */
const projectPath = (projectId: string) => `${API}/projects/${encodeURIComponent(projectId)}`;

/**
 * The admin API client with methods for interacting with projects, project fields, and invitations.
 */
export const adminApi = {
  /**
   * Lists all project fields.
   * @returns The list of project fields.
   */
  listProjectFields: () => send<ProjectFieldList>({ method: "GET", path: `${API}/project-fields` }, hasItems),

  /**
   * Lists all projects with optional filtering by status, limit, and cursor.
   * @param status Optional status to filter projects by.
   * @param limit Optional limit on the number of projects to return.
   * @param cursor Optional cursor for pagination.
   * @returns The list of projects matching the specified criteria.
   */
  listProjects: ({ status, limit, cursor }: ListProjectsParams = {}) => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (limit) query.set("limit", String(limit));
    if (cursor) query.set("cursor", cursor);
    const queryString = query.toString();
    const suffix = queryString ? `?${queryString}` : "";
    return send<ProjectList>({ method: "GET", path: `${API}/projects${suffix}` }, hasItems);
  },

  /**
   * Creates a new project with the given request body.
   * @param body The request body containing project details.
   * @returns The created project.
   */
  createProject: (body: CreateProjectRequest) => send<Project>({ method: "POST", path: `${API}/projects`, body }, hasId),

  /**
   * Retrieves the details of a specific project.
   * @param projectId The ID of the project to retrieve.
   * @returns The details of the specified project.
   */
  getProject: (projectId: string) =>
    send<ProjectDetails>(
      { method: "GET", path: projectPath(projectId) },
      (body) => hasId(body) && Array.isArray((body as ProjectDetails).invitations),
    ),

  /**
   * Creates an invitation for the specified project.
   * Returns the plaintext token exactly once. Callers must keep it out of caches, storage and logs.
   * @param projectId The ID of the project for which to create the invitation.
   * @param body The request body containing invitation details.
   * @returns The created invitation response containing the plaintext token.
   */
  createInvitation: (projectId: string, body: CreateInvitationRequest = {}) =>
    send<CreateInvitationResponse>(
      { method: "POST", path: `${projectPath(projectId)}/invitations`, body },
      (response) =>
        isObject(response) && typeof response.token === "string" && hasId((response as { invitation?: unknown }).invitation),
    ),

  /**
   * Revokes an invitation for the specified project.
   * @param projectId The ID of the project for which to revoke the invitation.
   * @param invitationId The ID of the invitation to revoke.
   * @returns The summary of the revoked invitation.
   */
  revokeInvitation: (projectId: string, invitationId: string) =>
    send<InvitationSummary>(
      { method: "POST", path: `${projectPath(projectId)}/invitations/${encodeURIComponent(invitationId)}/revoke` },
      hasId,
    ),
};
