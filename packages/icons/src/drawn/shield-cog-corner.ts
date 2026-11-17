import type { PixelIcon } from "../types";

// Shield with a cog badge in the secondary tone: the outline of `shield-01` stopped short of the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shield-cog-corner",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#",
    "..#.....o.o",
    "...#...ooooo",
    "....#..oo.oo",
    ".....#.ooooo",
    "........o.o",
  ],
};

export default icon;
