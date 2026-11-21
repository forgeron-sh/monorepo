import type { PixelIcon } from "../types";

// Pie chart: the ring of `clock-01` with its upper right quarter filled in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pie-chart",
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
    ".#........#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
