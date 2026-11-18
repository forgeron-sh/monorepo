import type { PixelIcon } from "../types";

// Virgo: an m whose last leg curls into a loop.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zodiac-virgo",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..##.##",
    ".#..#..#",
    ".#..#..#",
    ".#..#..#.##",
    ".#..#..##..#",
    ".#..#..#...#",
    ".#..#..#..#",
    ".#..#..#.#",
    "........#",
  ],
};

export default icon;
