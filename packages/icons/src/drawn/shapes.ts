import type { PixelIcon } from "../types";

// Shapes: a triangle over a square and a circle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shapes",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "...#....#",
    "..########",
    "",
    "",
    "#####..###",
    "#...#.#...#",
    "#...#.#...#",
    "#...#.#...#",
    "#####..###",
  ],
};

export default icon;
