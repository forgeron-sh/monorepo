import type { PixelIcon } from "../types";

// Parking sign of `parking-area-circle` crossed by a slash in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-parking-off",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o...####",
    ".o##....##",
    ".#o.......#",
    ".#.o####..#",
    "#...o#.##..#",
    "#...#o.##..#",
    "#...###o...#",
    "#...##..o..#",
    ".#..##...o#",
    ".#........o",
    "..##....##.o",
    "....####",
  ],
};

export default icon;
