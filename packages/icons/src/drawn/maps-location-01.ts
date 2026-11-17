import type { PixelIcon } from "../types";

// Folded map with a location pin badge in the shared lower-right corner (secondary tone), the map cut back by a one-pixel clearance.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "maps-location-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..####",
    ".#..####..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#",
    ".#..#..ooo",
    ".####.o...o",
    "....#.o...o",
    ".......o.o",
    "........o",
  ],
};

export default icon;
