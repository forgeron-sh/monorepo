import type { PixelIcon } from "../types";

// Map pin house: the shared map pin with a small house badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "map-pin-house",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..####",
    ".#....#",
    "#..##..#",
    "#..##..#",
    "#......#",
    ".#....#",
    "..#..#",
    "...##....o",
    "........o.o",
    ".......o...o",
    ".......o...o",
    ".......ooooo",
  ],
};

export default icon;
