import type { PixelIcon } from "../types";

// Cancer: two small rings with arcs, turned half a turn from each other.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zodiac-cancer",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..######",
    ".#..#...#",
    ".#..#....#",
    "..##",
    "........##",
    "..#....#..#",
    "...#...#..#",
    "....######",
  ],
};

export default icon;
