/**
 * Writing a Blueprint file as text: two-space JSON, where an object or array that fits on one
 * line of 100 columns is written on one line (one prim per line in a converted part), the layout
 * the repository's formatter keeps.
 */
import type { BlueprintFile } from "./types";

const WIDTH = 100;

function inline(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(inline).join(", ")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return "{}";
    return `{ ${entries.map(([k, v]) => `${JSON.stringify(k)}: ${inline(v)}`).join(", ")} }`;
  }
  return JSON.stringify(value);
}

function block(value: unknown, indent: string, lead: number): string {
  const flat = inline(value);
  if (indent.length + lead + flat.length <= WIDTH || value === null || typeof value !== "object")
    return flat;
  const inner = `${indent}  `;
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((v) => inner + block(v, inner, 1)).join(",\n")}\n${indent}]`;
  }
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "{}";
  const lines = entries.map(([k, v]) => {
    const key = `${JSON.stringify(k)}: `;
    return inner + key + block(v, inner, key.length + 1);
  });
  return `{\n${lines.join(",\n")}\n${indent}}`;
}

/** Any JSON value laid out as above, ending with a newline. */
export function formatJson(value: unknown): string {
  return `${block(value, "", 0)}\n`;
}

/** The text of a file, ending with a newline. Numbers keep every bit (JSON's shortest form). */
export function writeBlueprint(file: BlueprintFile): string {
  return formatJson(file);
}
