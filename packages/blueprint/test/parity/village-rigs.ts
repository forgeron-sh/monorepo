/**
 * Verbatim copies of `hash`, `smoke` and `flames` of apps/site/src/illustrations/village.ts
 * (module-private there): the oracles of the `smoke` and `sparks` rigs. `rigs.test.ts` fails when
 * the copies and the site's code part ways.
 */
import type { Block, Vec3 } from "../../src/core/types";

const seg = (out: Block[], a: Vec3, b: Vec3, ink: "dim" | "faint") =>
  out.push({ kind: "line", a, b, ink });

export function hash(x: number, y = 0): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Puffs rising from a chimney top: horizontal rings that grow, drift and thin out. */
export function smoke(
  out: Block[],
  top: Vec3,
  t: number,
  n: number,
  seed: number,
  rise = 9,
  thick = 1,
): void {
  // Thicker smoke is more puffs, packed tighter, not bigger ones: small squiggles in a low plume.
  for (let k = 0; k < n; k++) {
    const age = (t * 0.28 + k / n + hash(seed, k) * 0.1) % 1;
    const jx = (hash(seed, k + 100) - 0.5) * 1.6 * thick;
    const jy = (hash(seed, k + 200) - 0.5) * 1.6 * thick;
    const c: Vec3 = [
      top[0] + age * 3 + jx + Math.sin(age * 5 + seed) * 0.6,
      top[1] - age * 1.5 + jy,
      top[2] + age * rise,
    ];
    // A small squiggle, not a ring: three short strokes zigzagging up, wobbling with time.
    const len = 0.5 + age * 0.6;
    const wob = Math.sin(t * 6 + k * 1.3) * 0.25;
    const ink = age > 0.7 ? "faint" : "dim";
    let prev: Vec3 = [c[0] - len, c[1], c[2]];
    for (let j = 1; j <= 3; j++) {
      const q: Vec3 = [
        c[0] - len + (j * 2 * len) / 3,
        c[1] + (j % 2 ? 0.3 : -0.3) + wob,
        c[2] + j * 0.25,
      ];
      seg(out, prev, q, ink);
      prev = q;
    }
  }
}

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer4 = (x: number, y: number) => BAYER4[(((y % 4) + 4) % 4) * 4 + (((x % 4) + 4) % 4)]!;

export function flames(out: Block[], c: Vec3, t: number, n: number, seed: number): void {
  // Pixel-art flames in one colour: the shape is a grid of red pixels whose density, dithered
  // through a 4×4 Bayer matrix like the rest of the site, is full at the root and the core and
  // thins out towards the edges and the tip. Three stepped frames, like a sprite; one flame in
  // three is a big one.
  const frame = Math.floor(t * 6);
  const S = 0.2;
  for (let k = 0; k < n; k++) {
    const ox = (hash(seed, k) - 0.5) * 4;
    const oy = (hash(seed, k + 50) - 0.5) * 4;
    const f = (frame + k) % 3;
    const big = k % 3 === 0;
    const rows = (big ? 13 : 9) + (f === 1 ? 1 : 0);
    const half = big ? 4 : 3;
    const sway = f === 0 ? -1 : f === 2 ? 1 : 0;
    for (let i = 0; i < rows; i++) {
      const q = i / rows;
      const w = half * Math.pow(1 - q, 0.75);
      const shift = Math.round(sway * q * q * 2);
      for (let j = -half; j <= half; j++) {
        const d = Math.abs(j) / Math.max(0.5, w);
        if (d > 1) continue;
        // Plenty of holes, like the rest of the dither: never solid, thinner up and out.
        const density = (0.72 - q * 0.55) * (1 - d * d * 0.75);
        if (bayer4(j + k * 3, i + f) >= density) continue;
        out.push({
          kind: "dot",
          at: [c[0] + ox + (j + shift) * S, c[1] + oy, c[2] + i * S],
          ink: "alert",
          size: 1,
          layer: 1,
        });
      }
    }
  }
}
