import type { Block, FitOptions, Vec3, View } from "./types";

export type Point = readonly [x: number, y: number];

/** Iso 2:1 projection: x runs down-right, y down-left, z up; one unit is `u` pixels across. */
export function project(v: Vec3, view: View): Point {
  return [view.ox + (v[0] - v[1]) * view.u, view.oy + ((v[0] + v[1]) * view.u) / 2 - v[2] * view.u];
}

/** The world points that frame a block: a box's eight corners, a line's ends, an anchor. */
function anchors(block: Block): Vec3[] {
  switch (block.kind) {
    case "box": {
      const [x, y, z] = block.at;
      const [w, d, h] = block.size;
      const out: Vec3[] = [];
      for (const a of [0, w])
        for (const b of [0, d]) for (const c of [0, h]) out.push([x + a, y + b, z + c]);
      return out;
    }
    case "line":
      return [block.a, block.b];
    default:
      return [block.at];
  }
}

/**
 * Frames `blocks` in a `width` × `height` raster: projects the blocks not marked `decor` at
 * `u = 1`, takes the largest unit that keeps them inside `fill` of the raster (even by default,
 * never below 2) and centres them. Every whole-unit point then lands on a whole pixel.
 */
export function fit(
  blocks: readonly Block[],
  width: number,
  height: number,
  options: FitOptions = {},
): View {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const block of blocks) {
    if (block.decor) continue;
    for (const v of anchors(block)) {
      const [px, py] = project(v, { u: 1, ox: 0, oy: 0 });
      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    }
  }
  if (minX === Infinity) return { u: 2, ox: Math.round(width / 2), oy: Math.round(height / 2) };
  const fill = options.fill ?? 0.82;
  // A flat or point-like scene has no extent on one axis: that axis does not limit the unit.
  const bw = Math.max(maxX - minX, 1e-9);
  const bh = Math.max(maxY - minY, 1e-9);
  const raw = Math.min((width * fill) / bw, (height * fill) / bh);
  const u =
    options.unit === "any" ? Math.max(2, Math.floor(raw)) : Math.max(2, Math.floor(raw / 2) * 2);
  return {
    u,
    ox: Math.round(width / 2 - ((maxX + minX) / 2) * u),
    oy: Math.round(height / 2 - ((maxY + minY) / 2) * u),
  };
}
