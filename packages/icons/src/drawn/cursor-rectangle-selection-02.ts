import type { PixelIcon } from "../types";

// Pointer of `cursor-01` with a dashed square selection badge in the upper right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-rectangle-selection-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".......oo.oo",
    "..#....o...o",
    "..##",
    "..###..o...o",
    "..####.oo.oo",
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
