import type { PixelIcon } from "../types";

// Hair dryer: a round back with its vent in the secondary tone, a barrel and a handle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hair-dryer",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..####",
    ".#....####",
    "#..oo.....#",
    "#..oo.....#",
    ".#....####",
    "..#..#",
    "..#..#",
    "..#..#",
    "..#..#",
    "..####",
  ],
};

export default icon;
