import type { BoxBlock, DotBlock, LabelBlock, LineBlock, Vec3 } from "./types";

/** Thrown on a description Blueprint cannot render: the message names what to change. */
export class BlueprintError extends Error {
  override name = "BlueprintError";
}

type Options<T> = Omit<T, "kind">;

export function box(at: Vec3, size: Vec3, options: Omit<Options<BoxBlock>, "at" | "size"> = {}) {
  return { kind: "box", at, size, ...options } satisfies BoxBlock as BoxBlock;
}

export function line(a: Vec3, b: Vec3, options: Omit<Options<LineBlock>, "a" | "b"> = {}) {
  return { kind: "line", a, b, ...options } satisfies LineBlock as LineBlock;
}

export function dot(at: Vec3, options: Omit<Options<DotBlock>, "at"> = {}) {
  return { kind: "dot", at, ...options } satisfies DotBlock as DotBlock;
}

export function label(
  at: Vec3,
  text: string,
  options: Omit<Options<LabelBlock>, "at" | "text"> = {},
) {
  return { kind: "label", at, text, ...options } satisfies LabelBlock as LabelBlock;
}

/**
 * A dotted floor grid over a rectangle, every `step` units: faint, and `decor` so it never
 * drives the framing.
 */
export function floorGrid(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  step: number,
): LineBlock[] {
  const out: LineBlock[] = [];
  for (let x = x0; x <= x1; x += step)
    out.push(line([x, y0, 0], [x, y1, 0], { ink: "faint", dash: 1, decor: true }));
  for (let y = y0; y <= y1; y += step)
    out.push(line([x0, y, 0], [x1, y, 0], { ink: "faint", dash: 1, decor: true }));
  return out;
}
