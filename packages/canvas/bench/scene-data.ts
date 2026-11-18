// The scenes of the benchmark: deterministic (a seeded generator), shaped like a real diagram.
// Items are spread over a square whose side grows with sqrt(n), so the density stays the same at
// every size: zoomed in, a viewport shows a few hundred items whatever the document holds.

import type { Bounds, Item } from "../src/index";

export const KINDS = ["node", "sticky", "table", "frame"] as const;

/** Mean distance between items, in world units. */
const SPACING = 220;

export interface BenchScene {
  items: Item<null>[];
  /** The square the items are spread over. */
  world: Bounds;
}

/** xorshift32: the same numbers on every run and every engine. */
export function random(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0x1_0000_0000;
  };
}

export function makeScene(n: number, seed = 1): BenchScene {
  const rnd = random(seed);
  const side = Math.round(Math.sqrt(n) * SPACING);
  const items: Item<null>[] = [];
  for (let i = 0; i < n; i++) {
    // One item in a thousand is a frame: large, behind the others.
    const frame = i % 1000 === 999;
    const w = frame ? 600 + Math.round(rnd() * 900) : 60 + Math.round(rnd() * 180);
    const h = frame ? 400 + Math.round(rnd() * 600) : 40 + Math.round(rnd() * 120);
    items.push({
      id: `item-${i}`,
      kind: frame ? "frame" : KINDS[i % 3]!,
      bounds: { x: Math.round(rnd() * side), y: Math.round(rnd() * side), w, h },
      z: frame ? i - n : i,
      data: null,
    });
  }
  return { items, world: { x: 0, y: 0, w: side, h: side } };
}
