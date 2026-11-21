import type { PixelIcon } from "../types";

// Pie chart in a square: `square` with its top-right quarter filled in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pie-chart-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#....oooo#",
    ".#....oooo#",
    ".#....oooo#",
    ".#....oooo#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
