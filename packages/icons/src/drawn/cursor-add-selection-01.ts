import type { PixelIcon } from "../types";

// Pointer of `cursor-01` with a plus badge in the upper right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-add-selection-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........o",
    "..#......o",
    "..##...ooooo",
    "..###....o",
    "..####...o",
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
