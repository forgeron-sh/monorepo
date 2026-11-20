// `{{ step.field }}` references: found in a text, inserted at a caret, resolved against a record,
// and the variables a step offers. Pure, no React. The automation blocks re-export it.

import type { IconDefinition } from "@forgeron/icons";

/** One reference in a text: where it is and the path it reads. */
export interface TokenRange {
  from: number;
  to: number;
  path: string;
}

/** The `{{ … }}` of a text, in order. */
export function findTokens(text: string): TokenRange[] {
  const out: TokenRange[] = [];
  for (const m of text.matchAll(/\{\{\s*([^{}]*?)\s*\}\}/g)) {
    out.push({ from: m.index, to: m.index + m[0].length, path: m[1] ?? "" });
  }
  return out;
}

/** The reference being typed at the caret (`{{ deal.am|`): where its path starts, and the query. */
export function tokenQueryAt(text: string, caret: number): { from: number; query: string } | null {
  const m = /\{\{\s*([\w.$[\]-]*)$/.exec(text.slice(0, caret));
  if (!m) return null;
  const query = m[1] ?? "";
  return { from: caret - query.length, query };
}

/**
 * Writes `path` in place of `text[from, to)`, closing the reference unless it is closed already,
 * and gives the new text and where the caret goes (after the `}}`).
 */
export function insertToken(
  text: string,
  from: number,
  to: number,
  path: string,
): { text: string; caret: number } {
  const before = text.slice(0, from);
  const after = text.slice(to);
  const open = /\{\{$/.test(before) ? " " : "";
  const closed = /^\s*\}\}/.exec(after);
  const close = closed ? "" : " }}";
  const next = `${before}${open}${path}${close}${after}`;
  const caret =
    before.length + open.length + path.length + (closed ? closed[0].length : close.length);
  return { text: next, caret };
}

/** A reference to put in a text: `{{ deal.amount }}`. */
export const tokenOf = (path: string) => `{{ ${path} }}`;

/** Reads `a.b.0.c` in a value; `undefined` when a part is missing. */
export function getPath(value: unknown, path: string): unknown {
  let cur: unknown = value;
  for (const part of path.split(".").filter(Boolean)) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/**
 * The text with its references read from `data`. A text that is one reference alone gives the
 * value itself (a number stays a number); `missing` lists the paths that read nothing.
 */
export function resolveTemplate(
  text: string,
  data: unknown,
): { value: unknown; missing: string[] } {
  const tokens = findTokens(text);
  const missing: string[] = [];
  const read = (path: string) => {
    const v = getPath(data, path);
    if (v === undefined) missing.push(path);
    return v;
  };
  const only = tokens[0];
  if (tokens.length === 1 && only && only.from === 0 && only.to === text.length) {
    return { value: read(only.path), missing };
  }
  let out = "";
  let at = 0;
  for (const t of tokens) {
    const v = read(t.path);
    out +=
      text.slice(at, t.from) +
      (v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));
    at = t.to;
  }
  return { value: out + text.slice(at), missing };
}

/** One value a previous step gives, to insert as a reference. */
export interface VariableField {
  /** The full path: `deal.amount`. */
  path: string;
  /** A type or an example, shown at the end of the row: `number`, `9600`. */
  hint?: string;
}

/** The outputs of one previous step (or the trigger), as a group of the variable list. */
export interface VariableSource {
  /** The output variable of the step: `deal`. */
  id: string;
  /** The step: `Deal moved to Won`. */
  label: string;
  icon?: IconDefinition;
  fields: ReadonlyArray<VariableField>;
}

/** The paths of a sample output, each with its value as hint: what a step gave in a test run. */
export function variablesFromSample(
  id: string,
  label: string,
  sample: unknown,
  icon?: IconDefinition,
): VariableSource {
  const fields: VariableField[] = [];
  const walk = (v: unknown, path: string, depth: number) => {
    if (depth > 4) return;
    if (Array.isArray(v)) {
      fields.push({ path, hint: `${v.length} items` });
      return;
    }
    if (v !== null && typeof v === "object") {
      for (const [k, child] of Object.entries(v)) walk(child, `${path}.${k}`, depth + 1);
      return;
    }
    fields.push({ path, hint: v === null ? "null" : String(v) });
  };
  walk(sample, id, 0);
  return { id, label, fields, ...(icon ? { icon } : {}) };
}
