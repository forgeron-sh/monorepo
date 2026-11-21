// What a kind needs to read its data from JSON: the format error, typed readers that fall back to
// a default, and the fields every kind may carry (`group`, `frame`). The kinds (`../plugins`) use
// them in their `parse`; `document.ts` runs the kind that owns each item.

import { CanvasFormatError } from "@forgeron/canvas";
import { DEFAULT_FILL, DEFAULT_STROKE } from "./style";
import type { DrawFill, DrawStroke } from "./types";

export class DrawFormatError extends CanvasFormatError {
  override name = "DrawFormatError";
}

export type Raw = Record<string, unknown>;
export const isObject = (v: unknown): v is Raw =>
  typeof v === "object" && v !== null && !Array.isArray(v);
export const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);
export const num = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/** The `group` and `frame` an item may carry. */
export const readCommon = (raw: Raw) => ({
  ...(typeof raw.group === "string" && raw.group ? { group: raw.group } : {}),
  ...(typeof raw.frame === "string" && raw.frame ? { frame: raw.frame } : {}),
});

export function readFill(v: unknown): DrawFill {
  if (!isObject(v)) return DEFAULT_FILL;
  const opacity = typeof v.opacity === "number" ? { opacity: v.opacity } : {};
  if (v.type === "solid" && typeof v.color === "string")
    return { type: "solid", color: v.color, ...opacity };
  if (v.type === "pattern" && typeof v.color === "string" && typeof v.pattern === "string")
    return { type: "pattern", pattern: v.pattern, color: v.color, ...opacity };
  return DEFAULT_FILL;
}

export function readStroke(v: unknown): DrawStroke {
  if (!isObject(v)) return DEFAULT_STROKE;
  const dash = v.dash === "dashed" || v.dash === "dotted" ? v.dash : "solid";
  return {
    color: typeof v.color === "string" ? v.color : null,
    width: num(v.width, DEFAULT_STROKE.width),
    dash,
  };
}
