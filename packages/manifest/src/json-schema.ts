// Compares two JSON Schemas (action input and output, view params) field by field.
// Keywords we cannot reason about are treated as incompatible: an over-estimate only asks
// for a bigger declared bump, an under-estimate lets a breaking change through.

export type Json = Record<string, unknown>;

export type DeltaKind =
  | "added-required"
  | "added-optional"
  | "removed"
  | "made-required"
  | "made-optional"
  | "narrowed"
  | "widened"
  | "incompatible";

export interface Delta {
  /** Dotted path of the field, `[]` for array items; empty for the root. */
  path: string;
  kind: DeltaKind;
}

const IGNORED = new Set(["description", "title", "default", "examples", "$schema", "$comment"]);
const LOWER_BOUNDS = ["minimum", "exclusiveMinimum", "minLength", "minItems", "minProperties"];
const UPPER_BOUNDS = ["maximum", "exclusiveMaximum", "maxLength", "maxItems", "maxProperties"];
const HANDLED = new Set([
  "type",
  "enum",
  "pattern",
  "format",
  "items",
  "properties",
  "required",
  ...LOWER_BOUNDS,
  ...UPPER_BOUNDS,
]);

function isJson(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stable(value: unknown): string {
  return JSON.stringify(value, (_, v: unknown) =>
    isJson(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1))) : v,
  );
}

function equal(a: unknown, b: unknown): boolean {
  return stable(a) === stable(b);
}

function typeSet(value: unknown): string[] | undefined {
  if (typeof value === "string") return [value];
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) return value;
  return undefined;
}

// `integer` is a subset of `number`.
function isSubsetOf(a: string[], b: string[]): boolean {
  return a.every((x) => b.some((y) => x === y || (x === "integer" && y === "number")));
}

/** What `next` did to the set of values that `prev` accepted. */
function compareSets(
  prev: unknown[] | undefined,
  next: unknown[] | undefined,
  isSubset: (a: unknown[], b: unknown[]) => boolean,
): DeltaKind | undefined {
  if (!prev && !next) return undefined;
  if (!prev) return "narrowed";
  if (!next) return "widened";
  const widened = isSubset(prev, next);
  const narrowed = isSubset(next, prev);
  if (widened && narrowed) return undefined;
  if (widened) return "widened";
  if (narrowed) return "narrowed";
  return "incompatible";
}

function compareBound(
  prev: unknown,
  next: unknown,
  side: "lower" | "upper",
): DeltaKind | undefined {
  if (equal(prev, next)) return undefined;
  if (prev === undefined) return "narrowed";
  if (next === undefined) return "widened";
  if (typeof prev !== "number" || typeof next !== "number") return "incompatible";
  const tighter = side === "lower" ? next > prev : next < prev;
  return tighter ? "narrowed" : "widened";
}

function child(path: string, key: string): string {
  return path ? `${path}.${key}` : key;
}

function names(value: unknown): Set<string> {
  return new Set(Array.isArray(value) ? value.filter((v) => typeof v === "string") : []);
}

export function diffSchema(prev: Json, next: Json, path = "", out: Delta[] = []): Delta[] {
  const push = (kind: DeltaKind | undefined) => {
    if (kind) out.push({ path, kind });
  };

  const prevTypes = typeSet(prev.type);
  const nextTypes = typeSet(next.type);
  push(compareSets(prevTypes, nextTypes, (a, b) => isSubsetOf(a as string[], b as string[])));
  push(
    compareSets(
      Array.isArray(prev.enum) ? prev.enum : undefined,
      Array.isArray(next.enum) ? next.enum : undefined,
      (a, b) => a.every((x) => b.some((y) => equal(x, y))),
    ),
  );
  for (const key of LOWER_BOUNDS) push(compareBound(prev[key], next[key], "lower"));
  for (const key of UPPER_BOUNDS) push(compareBound(prev[key], next[key], "upper"));
  for (const key of ["pattern", "format"]) {
    if (equal(prev[key], next[key])) continue;
    push(
      prev[key] === undefined ? "narrowed" : next[key] === undefined ? "widened" : "incompatible",
    );
  }
  for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
    if (IGNORED.has(key) || HANDLED.has(key)) continue;
    if (!equal(prev[key], next[key])) push("incompatible");
  }

  if (isJson(prev.items) && isJson(next.items))
    diffSchema(prev.items, next.items, `${path}[]`, out);
  else if (!equal(prev.items, next.items)) push("incompatible");

  const prevProps = isJson(prev.properties) ? prev.properties : {};
  const nextProps = isJson(next.properties) ? next.properties : {};
  const prevRequired = names(prev.required);
  const nextRequired = names(next.required);
  for (const key of new Set([...Object.keys(prevProps), ...Object.keys(nextProps)])) {
    const at = child(path, key);
    const before = prevProps[key];
    const after = nextProps[key];
    if (before === undefined) {
      out.push({ path: at, kind: nextRequired.has(key) ? "added-required" : "added-optional" });
    } else if (after === undefined) {
      out.push({ path: at, kind: "removed" });
    } else {
      if (!prevRequired.has(key) && nextRequired.has(key))
        out.push({ path: at, kind: "made-required" });
      if (prevRequired.has(key) && !nextRequired.has(key))
        out.push({ path: at, kind: "made-optional" });
      if (isJson(before) && isJson(after)) diffSchema(before, after, at, out);
      else if (!equal(before, after)) out.push({ path: at, kind: "incompatible" });
    }
  }
  return out;
}
