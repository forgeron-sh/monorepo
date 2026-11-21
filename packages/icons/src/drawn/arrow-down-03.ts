import type { PixelIcon } from "../types";

// Thin arrow pointing down: a one-pixel shaft and a 45° head, the light sibling of `arrow-down-02`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-down-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    ".....#",
    ".....#",
    ".....#",
    ".....#",
    ".#...#...#",
    "..#..#..#",
    "...#.#.#",
    "....###",
    ".....#",
  ],
};

export default icon;
