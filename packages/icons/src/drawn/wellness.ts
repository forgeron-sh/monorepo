import type { PixelIcon } from "../types";

// Lotus flower: a tall middle petal between two side petals.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wellness",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    ".##.#..#.##",
    ".#.#....#.#",
    ".#..#..#..#",
    "..#..##..#",
    "...######",
  ],
};

export default icon;
