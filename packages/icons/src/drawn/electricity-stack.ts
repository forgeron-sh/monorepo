import type { PixelIcon } from "../types";

// Electricity stack: a box with a lightning bolt in the secondary tone, a second box behind it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "electricity-stack",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#######",
    "...#.....#",
    ".#######.#",
    ".#.....#.#",
    ".#...o.#.#",
    ".#..o..####",
    ".#.ooo.#",
    ".#..o..#",
    ".#.o...#",
    ".#######",
  ],
};

export default icon;
