import type { PixelIcon } from "../types";

// Snowflake: two-pixel cross and one-pixel diagonals, symmetric.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "snow",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".#...##...#",
    "..#..##..#",
    "...#.##.#",
    ".##########",
    ".##########",
    "...#.##.#",
    "..#..##..#",
    ".#...##...#",
    ".....##",
  ],
};

export default icon;
