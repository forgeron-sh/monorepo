import { type ColorRef, cssColor, parseColor, type RGB } from "@forgeron/shaders";
import { type Frame, SLOT_NAMES, type SlotName } from "./frame";

// Colours are shared with every effect (`@forgeron/shaders`, D-149).
export { cssColor, parseColor, type RGB };

/** The palette with every variable resolved to a colour. */
export type ResolvedPalette = Readonly<Record<SlotName, RGB>>;

/**
 * Resolves the variables of a palette with `read` (in a browser, a computed-style lookup). A
 * variable that is missing or not a parsable colour takes its fallback.
 */
export function resolvePalette(
  colors: Readonly<Record<SlotName, ColorRef>>,
  read: (name: string) => string | undefined = () => undefined,
): ResolvedPalette {
  const out = {} as Record<SlotName, RGB>;
  for (const name of SLOT_NAMES) {
    const ref = colors[name];
    const value = typeof ref === "string" ? ref : (read(ref.var) ?? "");
    out[name] = parseColor(value) ??
      parseColor(typeof ref === "string" ? "" : ref.fallback) ?? [0, 0, 0];
  }
  return out;
}

/** RGBA of a shaded frame, row by row; transparent where nothing was drawn. */
export function paint(
  f: Frame,
  colors: ResolvedPalette,
  out?: Uint8ClampedArray,
): Uint8ClampedArray {
  const data = out ?? new Uint8ClampedArray(f.width * f.height * 4);
  const table = SLOT_NAMES.map((n) => colors[n]);
  for (let i = 0; i < f.color.length; i++) {
    const c = f.color[i] ?? 0;
    const o = i * 4;
    const rgb = c > 0 ? table[c - 1] : undefined;
    if (!rgb) {
      data[o + 3] = 0;
      continue;
    }
    data[o] = rgb[0];
    data[o + 1] = rgb[1];
    data[o + 2] = rgb[2];
    data[o + 3] = 255;
  }
  return data;
}
