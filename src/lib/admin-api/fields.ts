import { z } from "zod";
import type { ProjectFieldDefinition, ProjectFieldType, ProjectFieldValue, ProjectFieldValues } from "./types";

/**
 * The extra project fields are data: the form is rendered from `listProjectFields`.
 * These helpers turn definitions into form defaults, validation and the request payload.
 */

const SUPPORTED_TYPES: readonly string[] = ["text", "long_text", "number", "boolean", "date", "select"];

/** False for a field type this build does not know (a newer backend). Such fields cannot be filled in. */
export const isSupportedFieldType = (type: string): type is ProjectFieldType => SUPPORTED_TYPES.includes(type);

/** Link lifetime in hours, from `CreateInvitationRequest.expiresInHours`. */
export const DEFAULT_EXPIRY_HOURS = 168; // 7 days
export const MIN_EXPIRY_HOURS = 1;
export const MAX_EXPIRY_HOURS = 720; // 30 days

export const isValidExpiry = (hours: number) =>
  Number.isInteger(hours) && hours >= MIN_EXPIRY_HOURS && hours <= MAX_EXPIRY_HOURS;

/** What the inputs hold: text for everything except `boolean`. */
export type FieldFormValue = string | boolean;
export type FieldFormValues = Record<string, FieldFormValue>;

/** The create-test form: the name, the dynamic extra fields (keyed by definition key) and the link expiry. */
export interface CreateFormValues {
  name: string;
  fields: FieldFormValues;
  expiresInHours: number;
}

export function sortDefinitions(definitions: ProjectFieldDefinition[]): ProjectFieldDefinition[] {
  return [...definitions].sort((a, b) => a.position - b.position || a.key.localeCompare(b.key));
}

export function defaultFieldValues(definitions: ProjectFieldDefinition[]): FieldFormValues {
  return Object.fromEntries(definitions.map((def) => [def.key, def.fieldType === "boolean" ? false : ""]));
}

const isCalendarDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

/** Text inputs: empty is only acceptable for optional fields; otherwise `check` reports a problem. */
const textLike = (def: ProjectFieldDefinition, check?: (value: string) => string | null) =>
  z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value === "") {
        if (def.required) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required" });
        return;
      }
      const problem = check?.(value);
      if (problem) ctx.addIssue({ code: z.ZodIssueCode.custom, message: problem });
    });

function fieldSchema(def: ProjectFieldDefinition): z.ZodTypeAny {
  switch (def.fieldType) {
    case "text":
    case "long_text":
      return textLike(def);
    case "number":
      return textLike(def, (value) => (Number.isFinite(Number(value)) ? null : "Enter a number"));
    case "date":
      return textLike(def, (value) => (isCalendarDate(value) ? null : "Enter a valid date"));
    case "select":
      return textLike(def, (value) => (def.options.includes(value) ? null : "Choose one of the options"));
    case "boolean":
      return z.boolean();
    default:
      // A type from a newer backend: optional ones are skipped, required ones block submission.
      return def.required
        ? z.any().superRefine((_, ctx) => {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "This field type is not supported by this version" });
          })
        : z.any();
  }
}

export function buildFormSchema(definitions: ProjectFieldDefinition[]) {
  return z.object({
    name: z.string().trim().min(1, "Enter a name").max(200, "Use at most 200 characters"),
    fields: z.object(Object.fromEntries(definitions.map((def) => [def.key, fieldSchema(def)]))),
    expiresInHours: z
      .number({ invalid_type_error: "Enter a whole number of hours" })
      .int("Enter a whole number of hours")
      .min(MIN_EXPIRY_HOURS, `At least ${MIN_EXPIRY_HOURS} hour`)
      .max(MAX_EXPIRY_HOURS, `At most ${MAX_EXPIRY_HOURS} hours (30 days)`),
  });
}

/**
 * The `fields` object of the createProject request, keyed by definition key.
 * Empty optional fields are omitted. A required boolean is always sent; an optional one only when checked.
 */
export function toRequestFields(definitions: ProjectFieldDefinition[], values: FieldFormValues): ProjectFieldValues {
  const result: ProjectFieldValues = {};

  for (const def of definitions) {
    if (!isSupportedFieldType(def.fieldType)) continue;
    const raw = values[def.key];

    if (def.fieldType === "boolean") {
      if (def.required || raw === true) result[def.key] = raw === true;
      continue;
    }

    const text = typeof raw === "string" ? raw : "";
    const trimmed = text.trim();
    if (trimmed === "") continue;

    if (def.fieldType === "number") result[def.key] = Number(trimmed);
    else if (def.fieldType === "text" || def.fieldType === "long_text") result[def.key] = trimmed;
    else result[def.key] = text; // date and select: exactly what was chosen
  }

  return result;
}

export interface FieldEntry {
  key: string;
  /** The definition's label, or the raw key when no active definition exists. */
  label: string;
  value: ProjectFieldValue;
}

/** Stored values for display: known keys in definition order first, then unknown keys by name. */
export function describeFieldValues(values: ProjectFieldValues, definitions: ProjectFieldDefinition[]): FieldEntry[] {
  const known = sortDefinitions(definitions)
    .filter((def) => Object.prototype.hasOwnProperty.call(values, def.key))
    .map((def) => ({ key: def.key, label: def.label, value: values[def.key] }));
  const knownKeys = new Set(known.map((entry) => entry.key));
  const unknown = Object.keys(values)
    .filter((key) => !knownKeys.has(key))
    .sort()
    .map((key) => ({ key, label: key, value: values[key] }));
  return [...known, ...unknown];
}

export function formatFieldValue(value: ProjectFieldValue): string {
  if (value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
