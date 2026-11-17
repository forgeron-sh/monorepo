import type { PixelIcon } from "../types";

// A baby's round face with a curl of hair.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "baby-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....oo",
    ".....o##",
    "..##....##",
    ".#........#",
    ".#........#",
    "#..##..##..#",
    "#..........#",
    "#..........#",
    "#....##....#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
