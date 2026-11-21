import { box, dither, type Filter, floorGrid, line, pixelate } from "@forgeron/blueprint";
import type { Block, SceneFn, SceneSource } from "@forgeron/blueprint";

/**
 * The lab's Blueprint scenes: the bench of the hero (animated) and the square cover of each
 * paper (still). Plain data, rendered to a static SVG at build and played on a canvas by the
 * engine in the browser.
 */

/** The look of forgeron.sh: the scene pixelated by 3, faces in the Bayer dither. */
export const FILTERS: readonly Filter[] = [pixelate(3), dither()];

/**
 * The bench: the lab's work laid out on the floor grid. A grid of small tiles (the icons), a
 * stack of plates on posts (the components), a tall block with storeys (the type), a dashed slot
 * for what comes next, and one ember cube lifted on its stem: the experiment being worked on.
 * Nothing stands on a larger block: the engine sorts whole blocks, so a big one would cover them.
 */
export const bench: SceneFn = ({ t }) => {
  const lift = 6 + Math.sin(t * 1.3) * 1.2;
  const blocks: Block[] = [...floorGrid(-3, 39, -3, 24, 3)];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      blocks.push(
        box([i * 3.2, j * 3.2, 0], [2.2, 2.2, 1 + ((i + j) % 2) * 1.2], { tone: [0.1, 0.3, 0.5] }),
      );
  for (let k = 0; k < 3; k++) {
    const z = k * 3.4 + Math.sin(t * 1.1 + k) * 0.2;
    blocks.push(box([13, 0, z], [8, 8, 1.2], { plate: true, vents: k === 0 }));
  }
  for (const [x, y] of [
    [13.8, 0.8],
    [20.2, 0.8],
    [13.8, 7.2],
    [20.2, 7.2],
  ] as const)
    blocks.push(line([x, y, 1.2], [x, y, 2 * 3.4 + 1.2], { ink: "dim", dash: 2 }));
  blocks.push(box([26, 0, 0], [6, 6, 12], { floors: 2, tone: [0.06, 0.2, 0.4] }));
  blocks.push(box([1, 13, 0], [8, 6, 4], { ghost: true }));
  blocks.push(line([18, 16, 0], [18, 16, lift], { ink: "dim", dash: 1 }));
  blocks.push(box([16.5, 14.5, lift], [3, 3, 3], { accent: true }));
  blocks.push(box([27, 14, 0], [5, 5, 2.4], { tone: [0.06, 0.2, 0.4] }));
  return { blocks };
};

/** R-001: an icon on its 12-pixel grid, drawn in tiles; the stroke that carries the idea in ember. */
const iconCover: SceneSource = (() => {
  const rows = [
    "............",
    "....####....",
    "...#....#...",
    "..#......#..",
    "..#......#..",
    "..#......#..",
    "...#....#...",
    "....####....",
    ".......##...",
    "........##..",
    ".........##.",
    "............",
  ];
  const blocks: Block[] = [...floorGrid(0, 12, 0, 12, 1)];
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === "#") blocks.push(box([x, y, 0], [1, 1, 0.8], { accent: y >= 8 }));
    }),
  );
  return { blocks };
})();

/** R-002: twenty thousand items, in miniature: a field of blocks, one selected, the culled view as a slot. */
const canvasCover: SceneSource = (() => {
  const blocks: Block[] = [...floorGrid(-1, 25, -1, 25, 4)];
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 6; j++) {
      const h = 1 + ((i * 7 + j * 3) % 5) * 0.9;
      blocks.push(
        box([i * 4, j * 4, 0], [2.6, 2.6, h], {
          accent: i === 3 && j === 2,
          tone: [0.06, 0.2, 0.4],
        }),
      );
    }
  blocks.push(box([7, 3, 0], [12, 12, 7], { ghost: true }));
  return { blocks };
})();

/** R-003: the engine's layers stacked on posts, the core in ember. */
const engineCover: SceneSource = (() => {
  const blocks: Block[] = [];
  const S = 12;
  for (let i = 0; i < 4; i++)
    blocks.push(box([0, 0, i * 5.2], [S, S, 1.6], { plate: true, vents: true, accent: i === 1 }));
  for (const [x, y] of [
    [1, 1],
    [S - 1, 1],
    [1, S - 1],
    [S - 1, S - 1],
  ] as const)
    blocks.push(line([x, y, 1.6], [x, y, 3 * 5.2 + 1.6], { ink: "dim", dash: 2 }));
  return { blocks };
})();

/** R-004: an assembly taken apart: its parts on the floor, one lifted above its dashed slot. */
const formatCover: SceneSource = {
  blocks: [
    ...floorGrid(-2, 18, -2, 18, 2),
    box([0, 0, 0], [5, 5, 3], { ghost: true }),
    box([0, 0, 7], [5, 5, 3], { accent: true }),
    line([2.5, 2.5, 3], [2.5, 2.5, 7], { ink: "dim", dash: 1 }),
    box([8, 0, 0], [6, 12, 7], { floors: 2, tone: [0.06, 0.2, 0.4] }),
    box([0, 8, 0], [5, 5, 2], { tone: [0.1, 0.3, 0.5] }),
    box([0, 15, 0], [14, 2, 1], { plate: true }),
  ],
};

/** R-005: a source, then its passes in a row, then the output in ember. */
const shadersCover: SceneSource = (() => {
  const blocks: Block[] = [...floorGrid(-2, 34, -2, 10, 2)];
  blocks.push(box([0, 0, 0], [6, 8, 6], { tone: [0.1, 0.3, 0.5] }));
  for (let i = 0; i < 4; i++) blocks.push(box([9 + i * 4.5, 0, 0], [1.2, 8, 6], { plate: true }));
  blocks.push(box([28, 0, 0], [6, 8, 6], { accent: true }));
  blocks.push(line([0, 4, 7.5], [34, 4, 7.5], { ink: "dim", dash: 2 }));
  return { blocks };
})();

/** The cover of each paper, by its number. */
export const COVERS: Record<string, SceneSource> = {
  "R-001": iconCover,
  "R-002": canvasCover,
  "R-003": engineCover,
  "R-004": formatCover,
  "R-005": shadersCover,
};
