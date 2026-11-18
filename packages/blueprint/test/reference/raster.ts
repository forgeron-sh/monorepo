import type { Frame, Material, Slot } from "./frame";
import type { Point } from "./project";

/** Writes one pixel (rounded, clipped). Faces carry a tone; every other material is solid. */
export function plot(
  f: Frame,
  x: number,
  y: number,
  material: Material,
  ink: Slot,
  tone = 1,
): void {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= f.width || py >= f.height) return;
  const i = py * f.width + px;
  f.material[i] = material;
  f.ink[i] = ink;
  f.tone[i] = tone;
}

/**
 * Bresenham between two rounded points. With an even unit, a 2:1 iso edge comes out as runs of
 * exactly two pixels per row. `dash` alternates `dash` pixels drawn and `dash` skipped.
 */
export function stroke(
  f: Frame,
  a: Point,
  b: Point,
  material: Material,
  ink: Slot,
  dash = 0,
): void {
  // Always walk from the upper end: an edge shared by two faces is drawn once per face, and
  // Bresenham breaks its ties differently in each direction, which doubled shared 2:1 edges.
  const flip =
    Math.round(a[1]) > Math.round(b[1]) || (Math.round(a[1]) === Math.round(b[1]) && a[0] > b[0]);
  const [from, to] = flip ? [b, a] : [a, b];
  let x0 = Math.round(from[0]);
  let y0 = Math.round(from[1]);
  const x1 = Math.round(to[0]);
  const y1 = Math.round(to[1]);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let i = 0; ; i++) {
    if (!dash || Math.floor(i / dash) % 2 === 0) plot(f, x0, y0, material, ink);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/** Closed outline of a polygon. */
export function outline(
  f: Frame,
  pts: readonly Point[],
  material: Material,
  ink: Slot,
  dash = 0,
): void {
  pts.forEach((p, i) => stroke(f, p, pts[(i + 1) % pts.length] as Point, material, ink, dash));
}

/**
 * Fills a convex polygon, sampling pixel centres: every covered pixel gets the material, the
 * colour family and the tone. Shading (solid, dithered) is left to the filters.
 */
export function fillConvex(
  f: Frame,
  pts: readonly Point[],
  material: Material,
  ink: Slot,
  tone: number,
): void {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.max(0, Math.floor(Math.min(...xs)));
  const maxX = Math.min(f.width - 1, Math.ceil(Math.max(...xs)));
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(f.height - 1, Math.ceil(Math.max(...ys)));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      let sign = 0;
      let inside = true;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i] as Point;
        const q = pts[(i + 1) % pts.length] as Point;
        const cross = (q[0] - p[0]) * (y + 0.5 - p[1]) - (q[1] - p[1]) * (x + 0.5 - p[0]);
        if (cross === 0) continue;
        const s = cross > 0 ? 1 : -1;
        if (sign === 0) sign = s;
        else if (s !== sign) {
          inside = false;
          break;
        }
      }
      if (!inside) continue;
      const i = y * f.width + x;
      f.material[i] = material;
      f.ink[i] = ink;
      f.tone[i] = tone;
    }
  }
}
