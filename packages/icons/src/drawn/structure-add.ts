import type { PixelIcon } from "../types";

// Three linked boxes of a structure with a plus badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "structure-add",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..####",
    ".#..####..#",
    ".####..####",
    "..#",
    "..#",
    "..#.....o",
    ".####...o",
    ".#..#.ooooo",
    ".####...o",
    "........o",
  ],
};

export default icon;
