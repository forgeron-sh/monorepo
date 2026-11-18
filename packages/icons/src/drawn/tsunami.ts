import type { PixelIcon } from "../types";

// A tall wave curling over the water: a tsunami. Water of `wave`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tsunami",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......###",
    "....##...#",
    "...#..#..#",
    "..#....##",
    "..#",
    ".#",
    ".#",
    "#",
    "",
    ".oo..oo..oo",
    "o..oo..oo..o",
  ],
};

export default icon;
