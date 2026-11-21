import type { PixelIcon } from "../types";

// Save all: a small floppy disk in front of the corner of a second one.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "save-all",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...#######",
    "...#.###.#",
    ".#.#.###..#",
    ".#.#......#",
    ".#.#.####.#",
    ".#.#.#..#.#",
    ".#.########",
    ".#",
    "..#######",
  ],
};

export default icon;
