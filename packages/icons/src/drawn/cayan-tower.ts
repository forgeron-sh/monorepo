import type { PixelIcon } from "../types";

// Cayan tower: a tall tower whose floors twist around it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "cayan-tower",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "...#....#",
    "...##...#",
    "...#.#..#",
    "...#..#.#",
    "...#...##",
    "...##...#",
    "...#.#..#",
    "...#..#.#",
    "...#...##",
    "...######",
  ],
};

export default icon;
