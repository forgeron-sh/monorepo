import type { PixelIcon } from "../types";

// Circle with its right half solid: the contrast symbol.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "contrast",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##..####",
    ".#....#####",
    ".#....#####",
    "#.....######",
    "#.....######",
    "#.....######",
    "#.....######",
    ".#....#####",
    ".#....#####",
    "..##..####",
    "....####",
  ],
};

export default icon;
