// DEVELOPMENT ONLY. Replaces the admin API with in-memory sample data so the UI can be built and
// reviewed before the backend exists. client.ts imports this only when `import.meta.env.DEV` and
// VITE_ADMIN_API_MOCK are set, so production builds contain neither this file nor the switch.
//
//   VITE_ADMIN_API_MOCK=on         sample projects and one field of every type
//   VITE_ADMIN_API_MOCK=empty      same, but no extra fields are defined
//   VITE_ADMIN_API_MOCK=not-ready  every call answers 501 not_implemented
//
// Switch it off by unsetting the variable and restarting `npm run dev`. Data resets on reload.
// Sign-in still uses the real Supabase project; only the admin-api calls are replaced.
import type { FunctionRequest, FunctionResponse } from "@/lib/supabase";
import type {
  ErrorCode,
  InvitationSummary,
  Project,
  ProjectDetails,
  ProjectFieldDefinition,
  ProjectFieldValues,
  ProjectStatus,
  RecordingProgress,
} from "./types";

export const MOCK_MARKER = "__admin_api_mock__";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const LATENCY_MS = 250;

const field = (
  position: number,
  key: string,
  label: string,
  fieldType: ProjectFieldDefinition["fieldType"],
  required: boolean,
  options: string[] = [],
): ProjectFieldDefinition => ({ key, label, fieldType, required, options, position });

// Deliberately not in position order: the UI must sort.
const FIELDS: ProjectFieldDefinition[] = [
  field(5, "test_date", "Test date", "date", false),
  field(1, "client_name", "Client name", "text", true),
  field(6, "market", "Market", "select", true, ["DACH", "France", "UK", "Nordics"]),
  field(3, "participants", "Planned participants", "number", false),
  field(2, "notes", "Notes", "long_text", false),
  field(4, "consent_signed", "Consent signed", "boolean", false),
];

interface StoredInvitation {
  id: string;
  createdAt: number;
  expiresAt: number;
  revokedAt: number | null;
  startedAt: number | null;
  lastUsedAt: number | null;
}

interface StoredProject {
  id: string;
  name: string;
  fields: ProjectFieldValues;
  createdAt: number;
  readyAt: number | null;
  invitations: StoredInvitation[];
  questionnaireSubmitted: boolean;
  recordings: { camera: RecordingProgress; screen: RecordingProgress };
}

const iso = (time: number | null) => (time === null ? null : new Date(time).toISOString());
const uuid = () => crypto.randomUUID();

function summarize(inv: StoredInvitation, now = Date.now()): InvitationSummary {
  // Precedence from the contract: revoked, started, expired, active.
  const status: InvitationSummary["status"] = inv.revokedAt
    ? "revoked"
    : inv.startedAt
      ? "started"
      : inv.expiresAt <= now
        ? "expired"
        : "active";
  return {
    id: inv.id,
    status,
    createdAt: iso(inv.createdAt)!,
    expiresAt: iso(inv.expiresAt)!,
    revokedAt: iso(inv.revokedAt),
    startedAt: iso(inv.startedAt),
    lastUsedAt: iso(inv.lastUsedAt),
  };
}

function statusOf(project: StoredProject): ProjectStatus {
  if (project.readyAt) return "READY";
  return project.invitations.some((inv) => inv.startedAt) ? "IN_PROGRESS" : "CREATED";
}

// Assumption made by this mock (the contract does not say): the "active invitation" shown in the
// list is the newest invitation that is not revoked, so started and expired ones show up too.
function toProject(project: StoredProject): Project {
  const current = [...project.invitations].reverse().find((inv) => !inv.revokedAt);
  return {
    id: project.id,
    name: project.name,
    status: statusOf(project),
    fields: project.fields,
    createdAt: iso(project.createdAt)!,
    readyAt: iso(project.readyAt),
    activeInvitation: current ? summarize(current) : null,
  };
}

function toDetails(project: StoredProject): ProjectDetails {
  return {
    ...toProject(project),
    invitations: project.invitations.map((inv) => summarize(inv)),
    questionnaireSubmitted: project.questionnaireSubmitted,
    recordings: project.recordings,
  };
}

function seed(): StoredProject[] {
  const now = Date.now();
  const markets = FIELDS.find((def) => def.key === "market")!.options;
  const invitation = (age: number, lifetime: number, patch: Partial<StoredInvitation> = {}): StoredInvitation => ({
    id: uuid(),
    createdAt: now - age,
    expiresAt: now - age + lifetime,
    revokedAt: null,
    startedAt: null,
    lastUsedAt: null,
    ...patch,
  });

  return Array.from({ length: 30 }, (_, i) => {
    const age = i * 18 * HOUR + HOUR;
    const base: StoredProject = {
      id: uuid(),
      name: `Pilot test ${30 - i}`,
      fields: { client_name: `Client ${30 - i}`, market: markets[i % markets.length], participants: 5 + i },
      createdAt: now - age,
      readyAt: null,
      invitations: [],
      questionnaireSubmitted: false,
      recordings: { camera: "NOT_STARTED", screen: "NOT_STARTED" },
    };
    if (i % 7 === 6) return base; // no link yet

    switch (i % 5) {
      case 0: {
        const started = now - age + 2 * HOUR;
        return {
          ...base,
          readyAt: started + HOUR,
          invitations: [invitation(age, 7 * DAY, { startedAt: started, lastUsedAt: started + HOUR })],
          questionnaireSubmitted: true,
          recordings: { camera: "VERIFIED", screen: "VERIFIED" },
        };
      }
      case 1: {
        const started = now - age + 2 * HOUR;
        return {
          ...base,
          invitations: [invitation(age, 7 * DAY, { startedAt: started, lastUsedAt: now - HOUR })],
          questionnaireSubmitted: true,
          recordings: { camera: "VERIFIED", screen: "UPLOAD_REQUESTED" },
        };
      }
      case 2:
        return { ...base, invitations: [invitation(age, 30 * DAY, { lastUsedAt: now - 3 * HOUR })] };
      case 3:
        return { ...base, invitations: [invitation(age, HOUR)] };
      default:
        return {
          ...base,
          invitations: [
            invitation(age, 7 * DAY, { revokedAt: now - age + DAY }),
            invitation(age - DAY, 7 * DAY),
          ],
        };
    }
  });
}

let store: StoredProject[] | null = null;
const projects = () => (store ??= seed());

const reply = (status: number, body: unknown): FunctionResponse => ({ status, body });
const fail = (status: number, code: ErrorCode, message: string) => reply(status, { error: { code, message } });
const invalid = (message: string) => fail(400, "validation_error", message);

function validateFields(definitions: ProjectFieldDefinition[], values: unknown): string | null {
  if (values === undefined) values = {};
  if (typeof values !== "object" || values === null || Array.isArray(values)) return "fields: must be an object";
  const input = values as Record<string, unknown>;

  for (const key of Object.keys(input)) {
    if (!definitions.some((def) => def.key === key)) return `fields.${key}: unknown field`;
  }
  for (const def of definitions) {
    const value = input[def.key];
    if (value === undefined || value === null) {
      if (def.required) return `fields.${def.key}: required`;
      continue;
    }
    const wrongType = `fields.${def.key}: must be ${def.fieldType === "long_text" ? "text" : def.fieldType}`;
    switch (def.fieldType) {
      case "text":
      case "long_text":
        if (typeof value !== "string" || (def.required && value.trim() === "")) return wrongType;
        break;
      case "number":
        if (typeof value !== "number" || !Number.isFinite(value)) return wrongType;
        break;
      case "boolean":
        if (typeof value !== "boolean") return wrongType;
        break;
      case "date":
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${wrongType} (YYYY-MM-DD)`;
        break;
      case "select":
        if (typeof value !== "string" || !def.options.includes(value)) {
          return `fields.${def.key}: must be one of ${def.options.join(", ")}`;
        }
        break;
    }
  }
  return null;
}

function createProject(body: unknown, definitions: ProjectFieldDefinition[]): FunctionResponse {
  const input = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const extra = Object.keys(input).find((key) => key !== "name" && key !== "fields");
  if (extra) return invalid(`${extra}: unknown property`);
  if (typeof input.name !== "string" || input.name.length < 1 || input.name.length > 200) {
    return invalid("name: must be 1-200 characters");
  }
  const problem = validateFields(definitions, input.fields);
  if (problem) return invalid(problem);

  const project: StoredProject = {
    id: uuid(),
    name: input.name,
    fields: (input.fields as ProjectFieldValues | undefined) ?? {},
    createdAt: Date.now(),
    readyAt: null,
    invitations: [],
    questionnaireSubmitted: false,
    recordings: { camera: "NOT_STARTED", screen: "NOT_STARTED" },
  };
  projects().unshift(project);
  return reply(201, toProject(project));
}

function createInvitation(project: StoredProject, body: unknown): FunctionResponse {
  if (project.readyAt) return fail(409, "conflict", "The project is already READY");

  const input = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const extra = Object.keys(input).find((key) => key !== "expiresInHours");
  if (extra) return invalid(`${extra}: unknown property`);
  const hours = input.expiresInHours ?? 168;
  if (typeof hours !== "number" || !Number.isInteger(hours) || hours < 1 || hours > 720) {
    return invalid("expiresInHours: must be an integer between 1 and 720");
  }

  const now = Date.now();
  // Renewing revokes the previously active invitation (this mock leaves a started one alone).
  for (const inv of project.invitations) {
    if (summarize(inv, now).status === "active") inv.revokedAt = now;
  }
  const created: StoredInvitation = {
    id: uuid(),
    createdAt: now,
    expiresAt: now + hours * HOUR,
    revokedAt: null,
    startedAt: null,
    lastUsedAt: null,
  };
  project.invitations.push(created);

  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return reply(201, { invitation: summarize(created, now), token });
}

function listProjects(query: URLSearchParams): FunctionResponse {
  const status = query.get("status");
  if (status && !["CREATED", "IN_PROGRESS", "READY"].includes(status)) return invalid("status: invalid value");
  const limit = query.has("limit") ? Number(query.get("limit")) : 25;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return invalid("limit: must be between 1 and 100");
  const offset = query.has("cursor") ? Number(atob(query.get("cursor")!)) : 0;
  if (!Number.isInteger(offset) || offset < 0) return invalid("cursor: invalid");

  const matching = projects().filter((project) => !status || statusOf(project) === status);
  const page = matching.slice(offset, offset + limit);
  const next = offset + limit;
  return reply(200, {
    items: page.map(toProject),
    nextCursor: next < matching.length ? btoa(String(next)) : null,
  });
}

export async function mockTransport({ method, path, body }: FunctionRequest): Promise<FunctionResponse> {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

  const mode = import.meta.env.VITE_ADMIN_API_MOCK;
  if (mode === "not-ready") return fail(501, "not_implemented", "Not implemented");
  const definitions = mode === "empty" ? [] : FIELDS;

  const url = new URL(path, "http://mock.invalid/");
  // admin-api / projects / {projectId} / invitations / {invitationId} / revoke
  const [, resource, projectId, sub, invitationId, action] = url.pathname.split("/").filter(Boolean);

  if (resource === "project-fields" && method === "GET") return reply(200, { items: definitions });
  if (resource !== "projects") return fail(404, "not_found", "Unknown route");

  if (!projectId) {
    if (method === "GET") return listProjects(url.searchParams);
    return createProject(body, definitions);
  }

  const project = projects().find((item) => item.id === projectId);
  if (!project) return fail(404, "not_found", "Project not found");

  if (!sub && method === "GET") return reply(200, toDetails(project));
  if (sub === "invitations" && !invitationId && method === "POST") return createInvitation(project, body);
  if (sub === "invitations" && action === "revoke" && method === "POST") {
    const inv = project.invitations.find((item) => item.id === invitationId);
    if (!inv) return fail(404, "not_found", "Invitation not found");
    inv.revokedAt ??= Date.now(); // idempotent
    return reply(200, summarize(inv));
  }
  return fail(405, "method_not_allowed", "Method not allowed");
}
