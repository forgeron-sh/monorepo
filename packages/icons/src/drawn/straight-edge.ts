import type { PixelIcon } from "../types";

// A straight edge: two nodes joined by one straight diagonal line.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "straight-edge",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........###",
    "........#.#",
    "........###",
    ".......#",
    "......#",
    ".....#",
    "....#",
    ".###",
    ".#.#",
    ".###",
  ],
};

export default icon;
