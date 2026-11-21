import type { PixelIcon } from "../types";

// Three stacked squares: a front square and the edges of two behind it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-stack",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".######",
    ".#",
    ".#.######",
    ".#.#",
    ".#.#.######",
    ".#.#.#....#",
    "...#.#....#",
    "...#.#....#",
    ".....#....#",
    ".....######",
  ],
};

export default icon;
