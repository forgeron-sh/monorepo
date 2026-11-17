import type { PixelIcon } from "../types";

// Pisces: two arcs back to back, joined by a bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zodiac-pisces",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#........#",
    "..#......#",
    "...#....#",
    "...#....#",
    ".##########",
    "...#....#",
    "...#....#",
    "..#......#",
    ".#........#",
  ],
};

export default icon;
