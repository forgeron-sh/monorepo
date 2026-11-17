import type { PixelIcon } from "../types";

// Vinyl record: a disc with its label in the secondary tone and two groove arcs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "vynil-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#....##..#",
    ".#......#.#",
    "#....oo..#.#",
    "#...oooo.#.#",
    "#.#.oooo...#",
    "#.#..oo....#",
    ".#.#......#",
    ".#..##....#",
    "..##....##",
    "....####",
  ],
};

export default icon;
