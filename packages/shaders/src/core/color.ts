/** A colour: a literal CSS colour, or a CSS variable with its fallback. */
export type ColorRef = string | { var: string; fallback: string };

export type RGB = readonly [r: number, g: number, b: number];

/** Parses `#rgb`, `#rrggbb` and `rgb(r g b)` / `rgb(r, g, b)`; anything else is null. */
export function parseColor(value: string): RGB | null {
  const v = value.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
  if (hex) {
    const h = hex[1] ?? "";
    const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
    const n = Number.parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(v);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

/** Literal of a colour reference for CSS: `var(--x, fallback)` or the colour itself. */
export function cssColor(ref: ColorRef): string {
  return typeof ref === "string" ? ref : `var(${ref.var}, ${ref.fallback})`;
}

/**
 * Resolves a colour reference with `read` (in a browser, a computed-style lookup of a custom
 * property). A string starting with `--` is a token; `fallback` applies when nothing parses.
 */
export function resolveRef(
  ref: ColorRef,
  read: (name: string) => string | undefined = () => undefined,
  fallback = "#000",
): RGB {
  if (typeof ref !== "string")
    return parseColor(read(ref.var) ?? "") ?? parseColor(ref.fallback) ?? [0, 0, 0];
  const raw = ref.startsWith("--") ? (read(ref) ?? "") : ref;
  return parseColor(raw) ?? parseColor(fallback) ?? [0, 0, 0];
}
