import type { PixelIcon } from "../types";

// Pointer of `cursor-01` with an hourglass badge in the upper right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-progress-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".......ooooo",
    "..#.....o.o",
    "..##.....o",
    "..###...o.o",
    "..####.ooooo",
    "..#####",
    "..######",
    "..####",
    "..##.##",
    "..#..##",
    "......##",
    "......##",
  ],
};

export default icon;
