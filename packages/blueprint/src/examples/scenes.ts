/**
 * Reference scenes ported from the site's lab engine (`SCENES.cube`, `SCENES.stack` in
 * apps/site/src/lab/engine.ts): same blocks, same motion. The floor grid is marked `decor`, which
 * the engine did implicitly by skipping faint lines when framing.
 */
import { box, floorGrid, line } from "../core/blocks";
import type { Block, SceneFn } from "../core/types";

/** A cube on a dotted floor, a small accent cube bobbing above it on a dashed stem. */
export const cube: SceneFn = ({ t }) => {
  const bob = 15 + Math.sin(t * 1.4) * 0.8;
  return {
    blocks: [
      ...floorGrid(-12, 22, -12, 22, 3),
      box([0, 0, 0], [10, 10, 10], { tone: [0.04, 0.14, 0.3] }),
      box([3.5, 3.5, bob], [3, 3, 3], { accent: true }),
      line([5, 5, 10], [5, 5, bob], { ink: "dim", dash: 1 }),
    ],
  };
};

/** Five plates stacked on dashed posts, breathing; the `active` one in accent. */
export const stack: SceneFn = ({ t, active }) => {
  const n = 5;
  const S = 12;
  const blocks: Block[] = [];
  for (let i = 0; i < n; i++) {
    const z = i * 5.2 + Math.sin(t * 1.2 + i * 0.9) * 0.35;
    blocks.push(box([0, 0, z], [S, S, 1.6], { plate: true, vents: true, accent: i === active }));
  }
  const top = (n - 1) * 5.2 + 1.6;
  for (const [x, y] of [
    [1, 1],
    [S - 1, 1],
    [1, S - 1],
    [S - 1, S - 1],
  ] as const)
    blocks.push(line([x, y, 1.6], [x, y, top], { ink: "dim", dash: 2 }));
  return { blocks };
};
