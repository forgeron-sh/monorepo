import type { PixelIcon } from "../types";

// Cinnamon roll seen from above: a ring with a spiral of filling inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cinnamon-roll",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..ooo...#",
    ".#.o...o..#",
    ".#.o.o..o.#",
    ".#.o.oo.o.#",
    ".#..o...o.#",
    ".#...ooo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
