import type { PixelIcon } from "../types";

// An X and an O joined by a move arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "strategy",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#..#.oooo",
    "..##.....o",
    "..##.....o",
    ".#..#..ooooo",
    "........ooo",
    ".........o",
    ".......##",
    "......#..#",
    "......#..#",
    ".......##",
  ],
};

export default icon;
