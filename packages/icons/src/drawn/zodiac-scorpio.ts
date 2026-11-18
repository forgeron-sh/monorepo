import type { PixelIcon } from "../types";

// Scorpio: an m whose last leg ends in an arrow.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zodiac-scorpio",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..##.##",
    ".#..#..#",
    ".#..#..#",
    ".#..#..#",
    ".#..#..#",
    ".#..#..#",
    ".#..#..#",
    ".#..#..#.#",
    ".......####",
    ".........#",
  ],
};

export default icon;
