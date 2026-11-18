import type { PixelIcon } from "../types";

// Bowl of soup: two wisps of steam in the secondary tone over a bowl on a foot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "soup",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....o..o",
    "...o....o",
    "....o..o",
    "",
    "############",
    "#..........#",
    ".#........#",
    "..#......#",
    "...######",
    "....####",
  ],
};

export default icon;
