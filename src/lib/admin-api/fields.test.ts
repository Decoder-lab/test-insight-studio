import { describe, expect, it } from "vitest";
import {
  buildFormSchema,
  defaultFieldValues,
  describeFieldValues,
  formatFieldValue,
  sortDefinitions,
  toRequestFields,
  type FieldFormValues,
} from "./fields";
import type { ProjectFieldDefinition } from "./types";

const def = (over: Partial<ProjectFieldDefinition> & Pick<ProjectFieldDefinition, "key" | "fieldType">): ProjectFieldDefinition => ({
  label: over.key,
  required: false,
  options: [],
  position: 1,
  ...over,
});

const ALL_TYPES: ProjectFieldDefinition[] = [
  def({ key: "title", fieldType: "text", required: true, position: 1 }),
  def({ key: "notes", fieldType: "long_text", position: 2 }),
  def({ key: "seats", fieldType: "number", position: 3 }),
  def({ key: "signed", fieldType: "boolean", position: 4 }),
  def({ key: "when", fieldType: "date", position: 5 }),
  def({ key: "market", fieldType: "select", options: ["DE", "FR"], position: 6 }),
];

const validate = (definitions: ProjectFieldDefinition[], fields: FieldFormValues, over: object = {}) =>
  buildFormSchema(definitions).safeParse({ name: "Test", expiresInHours: 168, fields, ...over });

describe("sortDefinitions", () => {
  it("orders by position and breaks ties by key without mutating the input", () => {
    const input = [
      def({ key: "c", fieldType: "text", position: 2 }),
      def({ key: "b", fieldType: "text", position: 1 }),
      def({ key: "a", fieldType: "text", position: 1 }),
    ];

    expect(sortDefinitions(input).map((d) => d.key)).toEqual(["a", "b", "c"]);
    expect(input.map((d) => d.key)).toEqual(["c", "b", "a"]);
  });
});

describe("defaultFieldValues", () => {
  it("starts booleans unchecked and everything else empty; an empty list gives no fields", () => {
    expect(defaultFieldValues(ALL_TYPES)).toEqual({ title: "", notes: "", seats: "", signed: false, when: "", market: "" });
    expect(defaultFieldValues([])).toEqual({});
  });
});

describe("buildFormSchema", () => {
  it("accepts a form with only the name and expiry when no fields are defined", () => {
    expect(validate([], {}).success).toBe(true);
  });

  it("requires the name (1-200 characters)", () => {
    expect(validate([], {}, { name: "   " }).success).toBe(false);
    expect(validate([], {}, { name: "x".repeat(201) }).success).toBe(false);
    expect(validate([], {}, { name: "x".repeat(200) }).success).toBe(true);
  });

  it.each([
    [1, true],
    [168, true],
    [720, true],
    [0, false],
    [721, false],
    [1.5, false],
    [Number.NaN, false],
  ])("expiry of %s hours is valid: %s", (hours, ok) => {
    expect(validate([], {}, { expiresInHours: hours }).success).toBe(ok);
  });

  it("requires required fields and lets optional ones stay empty", () => {
    const ok = { title: "T", notes: "", seats: "", signed: false, when: "", market: "" };

    expect(validate(ALL_TYPES, ok).success).toBe(true);
    expect(validate(ALL_TYPES, { ...ok, title: "  " }).success).toBe(false);
  });

  it("validates each type", () => {
    const ok = { title: "T", notes: "", seats: "", signed: false, when: "", market: "" };

    expect(validate(ALL_TYPES, { ...ok, seats: "12.5" }).success).toBe(true);
    expect(validate(ALL_TYPES, { ...ok, seats: "abc" }).success).toBe(false);
    expect(validate(ALL_TYPES, { ...ok, when: "2026-02-30" }).success).toBe(false);
    expect(validate(ALL_TYPES, { ...ok, when: "02/03/2026" }).success).toBe(false);
    expect(validate(ALL_TYPES, { ...ok, when: "2026-02-28" }).success).toBe(true);
    expect(validate(ALL_TYPES, { ...ok, market: "US" }).success).toBe(false);
    expect(validate(ALL_TYPES, { ...ok, market: "FR" }).success).toBe(true);
  });

  it("blocks a required field of a type this version does not know, but skips an optional one", () => {
    const unknown = (required: boolean) => [def({ key: "x", fieldType: "rating" as never, required })];

    expect(validate(unknown(true), { x: "" }).success).toBe(false);
    expect(validate(unknown(false), { x: "" }).success).toBe(true);
  });
});

describe("toRequestFields", () => {
  const values: FieldFormValues = { title: "  Hello ", notes: "", seats: "", signed: false, when: "", market: "" };

  it("omits empty optional fields", () => {
    expect(toRequestFields(ALL_TYPES, values)).toEqual({ title: "Hello" });
  });

  it("sends numbers as numbers, dates as YYYY-MM-DD and selects as chosen", () => {
    expect(
      toRequestFields(ALL_TYPES, { ...values, notes: " long\ntext ", seats: "12.5", when: "2026-03-09", market: "FR" }),
    ).toEqual({ title: "Hello", notes: "long\ntext", seats: 12.5, when: "2026-03-09", market: "FR" });
  });

  it("keeps a zero", () => {
    expect(toRequestFields(ALL_TYPES, { ...values, seats: "0" })).toMatchObject({ seats: 0 });
  });

  it("sends an optional boolean only when checked, and a required one always", () => {
    expect(toRequestFields(ALL_TYPES, { ...values, signed: true })).toMatchObject({ signed: true });

    const required = [def({ key: "agree", fieldType: "boolean", required: true })];
    expect(toRequestFields(required, { agree: false })).toEqual({ agree: false });
    expect(toRequestFields(required, { agree: true })).toEqual({ agree: true });
  });

  it("skips fields of an unknown type and returns {} when nothing is defined", () => {
    expect(toRequestFields([def({ key: "x", fieldType: "rating" as never })], { x: "5" })).toEqual({});
    expect(toRequestFields([], {})).toEqual({});
  });
});

describe("describeFieldValues", () => {
  const definitions = [
    def({ key: "market", label: "Market", fieldType: "select", position: 2 }),
    def({ key: "title", label: "Title", fieldType: "text", position: 1 }),
  ];

  it("labels values with their definition, in definition order, and falls back to the raw key", () => {
    const entries = describeFieldValues({ old_field: 3, market: "DE", title: "T" }, definitions);

    expect(entries).toEqual([
      { key: "title", label: "Title", value: "T" },
      { key: "market", label: "Market", value: "DE" },
      { key: "old_field", label: "old_field", value: 3 },
    ]);
  });

  it("shows only stored values and works without any definitions", () => {
    expect(describeFieldValues({ title: "T" }, definitions)).toHaveLength(1);
    expect(describeFieldValues({ a: 1 }, [])).toEqual([{ key: "a", label: "a", value: 1 }]);
  });
});

describe("formatFieldValue", () => {
  it.each([
    [true, "Yes"],
    [false, "No"],
    [null, "—"],
    ["", "—"],
    [0, "0"],
    ["2026-03-09", "2026-03-09"],
  ])("formats %s", (value, text) => {
    expect(formatFieldValue(value)).toBe(text);
  });
});
