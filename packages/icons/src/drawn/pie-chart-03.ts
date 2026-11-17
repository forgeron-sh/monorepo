import type { PixelIcon } from "../types";

// Pie chart at three quarters: the ring of `pie-chart` filled in the secondary tone except its
// upper left quarter.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pie-chart-03",
  implemented: true,
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
    ".#oooooooo#",
    ".#oooooooo#",
    ".#oooooooo#",
    "..#oooooo#",
    "...######",
  ],
};

export default icon;
