import type { ColorRef } from "../core/filters";
import { parseColor, type RGB } from "../core/palette";

/**
 * Resolves a colour reference against the computed style of `el` (so a theme scoped to a section
 * applies); a missing or unparsable variable takes its fallback.
 */
export function resolveColor(el: Element, ref: ColorRef): RGB {
  if (typeof ref === "string") return parseColor(ref) ?? [0, 0, 0];
  const value = el.ownerDocument.defaultView?.getComputedStyle(el).getPropertyValue(ref.var) ?? "";
  return parseColor(value) ?? parseColor(ref.fallback) ?? [0, 0, 0];
}
