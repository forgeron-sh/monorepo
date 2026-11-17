import type { PixelIcon } from "../types";

// Rotate towards the bottom left: a square, a quarter arc in the secondary tone curling round it from its arrowhead at the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rotate-bottom-left",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    ".#.....#",
    ".#.....#..o",
    ".#.....#.ooo",
    ".#.....#..o",
    ".#.....#..o",
    "..#####...o",
    "..........o",
    ".........o",
    ".....oooo",
  ],
};

export default icon;
