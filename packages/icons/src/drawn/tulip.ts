import type { PixelIcon } from "../types";

// A tulip: a three-pointed cup on a stem with a leaf.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tulip",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#..##..#",
    "..###..###",
    "..#......#",
    "..#......#",
    "...#....#",
    "....####",
    ".....o",
    ".....o..o",
    ".....o.o",
    ".....oo",
    ".....o",
  ],
};

export default icon;
