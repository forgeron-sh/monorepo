import type { PixelIcon } from "../types";

// Pie chart at one half: the ring of `pie-chart` with its right half filled in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pie-chart-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#...ooo#",
    ".#....oooo#",
    ".#....oooo#",
    ".#....oooo#",
    ".#....oooo#",
    ".#....oooo#",
    ".#....oooo#",
    "..#...ooo#",
    "...######",
  ],
};

export default icon;
