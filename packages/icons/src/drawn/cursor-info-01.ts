import type { PixelIcon } from "../types";

// Pointer of `cursor-01` with a letter i badge in the upper right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-info-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........o",
    "..#",
    "..##....oo",
    "..###....o",
    "..####..ooo",
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
