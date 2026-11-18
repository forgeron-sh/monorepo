/**
 * Checks a value against the format's JSON schema (`schema.ts`), with messages that name the path
 * of the faulty value as a JSON Pointer (`/parts/rack/prims/0/size`). It interprets the subset of
 * JSON Schema 2020-12 the format's schema uses, and nothing else.
 */
import { BlueprintError } from "../core/blocks";
import { type JsonSchema, SCHEMA } from "./schema";
import { type BlueprintFile, FORMAT_VERSION } from "./types";

type Schema = JsonSchema | boolean;

const DEFS = SCHEMA.$defs as Record<string, JsonSchema>;
const MAX_ERRORS = 8;

/** A path segment as JSON Pointer writes it. */
const segment = (key: string | number) => String(key).replaceAll("~", "~0").replaceAll("/", "~1");

const typeOf = (value: unknown): string =>
  value === null
    ? "null"
    : Array.isArray(value)
      ? "array"
      : typeof value === "number" && Number.isInteger(value)
        ? "integer"
        : typeof value;

const show = (value: unknown) => {
  const text = JSON.stringify(value);
  return text === undefined ? String(value) : text.length > 40 ? `${text.slice(0, 37)}...` : text;
};

function matchesType(type: string, value: unknown): boolean {
  const actual = typeOf(value);
  return type === "number" ? actual === "number" || actual === "integer" : actual === type;
}

/** The constant a branch of `anyOf` puts on `key` (`kind`, `type`), if any. */
function discriminant(schema: Schema, key: string): unknown {
  if (typeof schema !== "object") return undefined;
  const resolved = schema.$ref ? DEFS[String(schema.$ref).slice("#/$defs/".length)] : schema;
  const props = resolved?.properties as Record<string, JsonSchema> | undefined;
  return props?.[key]?.const;
}

function check(schema: Schema, value: unknown, path: string, errors: string[]): void {
  if (errors.length >= MAX_ERRORS) return;
  if (schema === true) return;
  if (schema === false) {
    errors.push(`${path || "/"}: not allowed`);
    return;
  }
  if (typeof schema.$ref === "string") {
    const target = DEFS[schema.$ref.slice("#/$defs/".length)];
    if (!target) throw new Error(`schema: unknown $ref ${schema.$ref}`);
    check(target, value, path, errors);
    return;
  }
  const at = path || "/";
  if (Array.isArray(schema.anyOf)) {
    checkAnyOf(schema.anyOf as Schema[], value, path, errors);
    return;
  }
  if ("const" in schema && value !== schema.const) {
    errors.push(`${at}: expected ${show(schema.const)}, got ${show(value)}`);
    return;
  }
  if (Array.isArray(schema.enum) && !schema.enum.includes(value as never)) {
    errors.push(`${at}: expected one of ${schema.enum.map(show).join(", ")}, got ${show(value)}`);
    return;
  }
  if (typeof schema.type === "string" && !matchesType(schema.type, value)) {
    errors.push(`${at}: expected ${schema.type}, got ${typeOf(value)}`);
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) errors.push(`${at}: expected a finite number`);
    if (typeof schema.minimum === "number" && value < schema.minimum)
      errors.push(`${at}: expected at least ${schema.minimum}, got ${value}`);
    if (typeof schema.maximum === "number" && value > schema.maximum)
      errors.push(`${at}: expected at most ${schema.maximum}, got ${value}`);
    if (typeof schema.exclusiveMinimum === "number" && value <= schema.exclusiveMinimum)
      errors.push(`${at}: expected more than ${schema.exclusiveMinimum}, got ${value}`);
  }
  if (typeof value === "string") {
    if (typeof schema.minLength === "number" && value.length < schema.minLength)
      errors.push(`${at}: expected a non-empty string`);
    if (typeof schema.pattern === "string" && !new RegExp(schema.pattern).test(value))
      errors.push(`${at}: ${show(value)} does not match ${schema.pattern}`);
  }
  if (Array.isArray(value)) checkArray(schema, value, path, errors);
  else if (typeOf(value) === "object") checkObject(schema, value as object, path, errors);
}

function checkArray(schema: JsonSchema, value: unknown[], path: string, errors: string[]): void {
  const at = path || "/";
  if (typeof schema.minItems === "number" && value.length < schema.minItems)
    errors.push(`${at}: expected at least ${schema.minItems} items, got ${value.length}`);
  const prefix = (schema.prefixItems ?? []) as Schema[];
  value.forEach((item, i) => {
    const itemSchema = i < prefix.length ? prefix[i]! : (schema.items as Schema | undefined);
    if (itemSchema === false) errors.push(`${at}: expected at most ${prefix.length} items`);
    else if (itemSchema !== undefined) check(itemSchema, item, `${path}/${i}`, errors);
  });
}

function checkObject(schema: JsonSchema, value: object, path: string, errors: string[]): void {
  const at = path || "/";
  const record = value as Record<string, unknown>;
  for (const key of (schema.required ?? []) as string[])
    if (!(key in record)) errors.push(`${at}: missing "${key}"`);
  const props = (schema.properties ?? {}) as Record<string, Schema>;
  const names = schema.propertyNames as JsonSchema | undefined;
  for (const [key, item] of Object.entries(record)) {
    const keyPath = `${path}/${segment(key)}`;
    if (names && typeof names.pattern === "string" && !new RegExp(names.pattern).test(key))
      errors.push(`${keyPath}: the name ${show(key)} does not match ${names.pattern}`);
    if (Object.hasOwn(props, key)) check(props[key]!, item, keyPath, errors);
    else if (schema.additionalProperties === false)
      errors.push(`${keyPath}: unknown property "${key}"`);
    else if (typeof schema.additionalProperties === "object")
      check(schema.additionalProperties as JsonSchema, item, keyPath, errors);
  }
}

function checkAnyOf(options: Schema[], value: unknown, path: string, errors: string[]): void {
  const at = path || "/";
  // Tagged unions (prims by `kind`, vars by `type`) pick their branch by the tag.
  for (const key of ["kind", "type"]) {
    const tags: unknown[] = options.map((o) => discriminant(o, key));
    if (tags.every((t) => typeof t === "string") && typeOf(value) === "object") {
      const tag = (value as Record<string, unknown>)[key];
      const index = tags.indexOf(tag as string);
      if (index < 0) {
        errors.push(`${at}/${key}: expected one of ${tags.map(show).join(", ")}, got ${show(tag)}`);
        return;
      }
      check(options[index]!, value, path, errors);
      return;
    }
  }
  const failures: string[][] = [];
  for (const option of options) {
    const local: string[] = [];
    check(option, value, path, local);
    if (local.length === 0) return;
    failures.push(local);
  }
  // Report the branch that went deepest (its first error has the longest path).
  const depth = (list: string[]) => (list[0] ?? "").split(":")[0]!.split("/").length;
  const best = failures.reduce((a, b) => (depth(b) > depth(a) ? b : a));
  if (depth(best) > at.split("/").length) errors.push(...best);
  else errors.push(`${at}: ${show(value)} matches none of the allowed forms`);
}

/** The errors of `value` against the schema: empty when it is a valid Blueprint file. */
export function schemaErrors(value: unknown): string[] {
  const errors: string[] = [];
  check(SCHEMA, value, "", errors);
  return errors.slice(0, MAX_ERRORS);
}

/**
 * Checks a parsed file: its version first (a newer one is an error that names it), then the
 * schema, then the rules a schema cannot state (unique instance ids, snaps to known instances).
 * `source` names the file in messages.
 */
export function validate(value: unknown, source = "blueprint"): BlueprintFile {
  const version = (value as { version?: unknown } | null)?.version;
  if (typeof version === "number" && version > FORMAT_VERSION)
    throw new BlueprintError(
      `${source}: /version: this file is version ${version}; this reader knows version ${FORMAT_VERSION} and older`,
    );
  const errors = schemaErrors(value);
  if (errors.length === 0) errors.push(...ruleErrors(value as BlueprintFile));
  if (errors.length) throw new BlueprintError(`${source}: ${errors.join("\n")}`);
  return value as BlueprintFile;
}

function ruleErrors(file: BlueprintFile): string[] {
  const errors: string[] = [];
  const each = (path: string, instances: { id?: string; snap?: { to: string } }[]) => {
    const ids = new Set<string>();
    instances.forEach((inst, i) => {
      if (inst.id === undefined) return;
      if (ids.has(inst.id)) errors.push(`${path}/instances/${i}/id: "${inst.id}" is used twice`);
      ids.add(inst.id);
    });
    instances.forEach((inst, i) => {
      const target = inst.snap?.to.split(".")[0];
      if (target !== undefined && !ids.has(target))
        errors.push(`${path}/instances/${i}/snap/to: no instance "${target}" in this assembly`);
    });
  };
  for (const [name, a] of Object.entries(file.assemblies ?? {}))
    each(`/assemblies/${segment(name)}`, a.instances);
  for (const [name, s] of Object.entries(file.scenes ?? {}))
    each(`/scenes/${segment(name)}/root`, s.root.instances);
  return errors;
}
