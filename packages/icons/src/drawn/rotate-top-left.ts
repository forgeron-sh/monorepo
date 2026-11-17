import type { PixelIcon } from "../types";

// Rotate towards the top left: a square low on the left, an arc in the secondary tone over it ending in a leftward arrowhead.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rotate-top-left",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".......o",
    "......oooo",
    ".......o..o",
    "...........o",
    "..#####....o",
    ".#.....#...o",
    ".#.....#",
    ".#.....#",
    ".#.....#",
    ".#.....#",
    "..#####",
  ],
};

export default icon;
