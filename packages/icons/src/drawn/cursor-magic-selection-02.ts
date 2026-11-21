import type { PixelIcon } from "../types";

// Pointer of `cursor-01` with a sparkle badge in the upper right: magic selection.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-magic-selection-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........o",
    "..#.....ooo",
    "..##...ooooo",
    "..###...ooo",
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
