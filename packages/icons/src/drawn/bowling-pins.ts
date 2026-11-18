import type { PixelIcon } from "../types";

// Two bowling pins side by side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bowling-pins",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..##....##",
    ".#..#..#..#",
    ".#..#..#..#",
    "..oo....oo",
    ".#..#..#..#",
    "#....##....#",
    "#....##....#",
    "#....##....#",
    "#....##....#",
    ".#..#..#..#",
    ".####..####",
  ],
};

export default icon;
