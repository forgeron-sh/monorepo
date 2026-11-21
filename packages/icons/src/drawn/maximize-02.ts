import type { PixelIcon } from "../types";

// Maximise: one diagonal with arrowheads at both ends, pointing out to two corners (heads of `maximize-01`).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "maximize-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......####",
    ".........##",
    "........#.#",
    ".......#..#",
    "......#",
    ".....#",
    ".#..#",
    ".#.#",
    ".##",
    ".####",
  ],
};

export default icon;
