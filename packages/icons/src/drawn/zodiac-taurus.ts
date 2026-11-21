import type { PixelIcon } from "../types";

// Taurus: a ring under a pair of upturned horns.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zodiac-taurus",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#........#",
    "..##....##",
    "....####",
    "...#....#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "...#....#",
    "....####",
  ],
};

export default icon;
