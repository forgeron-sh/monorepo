import type { PixelIcon } from "../types";

// Relationship chart: a ring node linked to three smaller nodes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-relationship",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##.....##",
    ".#..#######",
    ".#..#",
    "..##.#",
    "..#...#",
    "..#....#",
    "..#.....##",
    "..##....##",
    "..##",
  ],
};

export default icon;
