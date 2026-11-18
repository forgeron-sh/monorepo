import type { PixelIcon } from "../types";

// Pair of curly braces.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "braces",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    "..#......#",
    "..#......#",
    "..#......#",
    ".#........#",
    ".#........#",
    "..#......#",
    "..#......#",
    "..#......#",
    "...##..##",
  ],
};

export default icon;
