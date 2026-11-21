import type { PixelIcon } from "../types";

// Sagittarius: an arrow pointing up-right, crossed by a short bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zodiac-sagittarius",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#####",
    ".........##",
    "........#.#",
    ".......#..#",
    "..#...#...#",
    "...#.#",
    "....#",
    "...#.#",
    "..#...#",
    ".#",
  ],
};

export default icon;
