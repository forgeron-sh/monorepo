import type { PixelIcon } from "../types";

// Capricorn: a v-shaped stroke rising into a loop with a tail.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zodiac-capricorn",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#...#",
    "..#..#",
    "...#.#",
    "....##",
    ".....#..##",
    ".....#.#..#",
    ".....#.#..#",
    ".....##..#",
    "....#.##",
  ],
};

export default icon;
