import type { ColorRef } from "./color";

/**
 * The settings of a pass or a source, as data: they validate a preset, fill its defaults, write
 * its JSON schema and, later, draw the pass editor's controls.
 */
export type ParamSpec =
  | {
      type: "number";
      default: number;
      min?: number;
      max?: number;
      integer?: boolean;
      description: string;
    }
  | { type: "boolean"; default: boolean; description: string }
  | {
      type: "enum";
      values: readonly (string | number)[];
      default: string | number;
      description: string;
    }
  | { type: "string"; default: string; description: string }
  | { type: "colors"; default: readonly ColorRef[]; description: string }
  | { type: "indices"; default: readonly number[]; description: string }
  | { type: "steps"; default: readonly (readonly [number, number])[]; description: string };

export type ParamsSchema = Readonly<Record<string, ParamSpec>>;

/** A problem in a preset, at a JSON path (`passes[1].matrix`). */
export interface PresetIssue {
  path: string;
  message: string;
}

const isColorRef = (v: unknown): v is ColorRef =>
  typeof v === "string" ||
  (typeof v === "object" &&
    v !== null &&
    typeof (v as { var?: unknown }).var === "string" &&
    typeof (v as { fallback?: unknown }).fallback === "string" &&
    Object.keys(v).length === 2);

function check(spec: ParamSpec, v: unknown): string | null {
  switch (spec.type) {
    case "number":
      if (typeof v !== "number" || !Number.isFinite(v)) return "must be a number";
      if (spec.integer && !Number.isInteger(v)) return "must be a whole number";
      if (spec.min !== undefined && v < spec.min) return `must be ${spec.min} or more`;
      if (spec.max !== undefined && v > spec.max) return `must be ${spec.max} or less`;
      return null;
    case "boolean":
      return typeof v === "boolean" ? null : "must be true or false";
    case "enum":
      return spec.values.includes(v as string | number)
        ? null
        : `must be one of ${spec.values.map((x) => JSON.stringify(x)).join(", ")}`;
    case "string":
      return typeof v === "string" ? null : "must be a string";
    case "colors":
      return Array.isArray(v) && v.length > 0 && v.every(isColorRef)
        ? null
        : 'must be a list of colours ("#rrggbb", "--token" or { "var", "fallback" })';
    case "indices":
      return Array.isArray(v) && v.every((i) => Number.isInteger(i) && i >= 0)
        ? null
        : "must be a list of tone indices";
    case "steps":
      return Array.isArray(v) &&
        v.length > 0 &&
        v.every(
          (s) =>
            Array.isArray(s) &&
            s.length === 2 &&
            s.every((n) => typeof n === "number" && Number.isFinite(n)),
        )
        ? null
        : "must be a list of [offset, scale] pairs";
  }
}

/**
 * The params of `input` checked against `schema`, defaults filled; issues are pushed with `path`.
 * `type` is the discriminant and is kept; any other unknown key is an issue.
 */
export function readParams(
  schema: ParamsSchema,
  input: Readonly<Record<string, unknown>>,
  path: string,
  issues: PresetIssue[],
): Record<string, unknown> {
  const out: Record<string, unknown> = { type: input.type };
  for (const key of Object.keys(input)) {
    if (key !== "type" && !(key in schema))
      issues.push({ path: `${path}.${key}`, message: "is not a setting of this step" });
  }
  for (const [key, spec] of Object.entries(schema)) {
    const v = input[key];
    if (v === undefined) {
      out[key] = spec.default;
      continue;
    }
    const problem = check(spec, v);
    if (problem) issues.push({ path: `${path}.${key}`, message: problem });
    out[key] = v;
  }
  return out;
}

const COLOR_SCHEMA = {
  oneOf: [
    { type: "string", description: 'A CSS colour ("#rrggbb", "rgb(…)") or a token ("--accent").' },
    {
      type: "object",
      properties: { var: { type: "string" }, fallback: { type: "string" } },
      required: ["var", "fallback"],
      additionalProperties: false,
    },
  ],
};

/** The JSON schema of one setting. */
export function jsonSchemaOf(spec: ParamSpec): Record<string, unknown> {
  const base = { description: spec.description };
  switch (spec.type) {
    case "number":
      return {
        ...base,
        type: spec.integer ? "integer" : "number",
        ...(spec.min !== undefined ? { minimum: spec.min } : {}),
        ...(spec.max !== undefined ? { maximum: spec.max } : {}),
        default: spec.default,
      };
    case "boolean":
      return { ...base, type: "boolean", default: spec.default };
    case "enum":
      return { ...base, enum: [...spec.values], default: spec.default };
    case "string":
      return { ...base, type: "string", default: spec.default };
    case "colors":
      return { ...base, type: "array", minItems: 1, items: COLOR_SCHEMA, default: spec.default };
    case "indices":
      return {
        ...base,
        type: "array",
        items: { type: "integer", minimum: 0 },
        default: spec.default,
      };
    case "steps":
      return {
        ...base,
        type: "array",
        minItems: 1,
        items: {
          type: "array",
          prefixItems: [{ type: "number" }, { type: "number" }],
          minItems: 2,
          maxItems: 2,
        },
        default: spec.default,
      };
  }
}
