import type { PixelIcon } from "../types";

// A above Z, with a down arrow: sort from A to Z.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sorting-a-z-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##",
    ".#..#....o",
    ".####....o",
    ".#..#....o",
    ".#..#....o",
    ".........o",
    ".####....o",
    "....#..o.o.o",
    "...#....ooo",
    "..#......o",
    ".####",
  ],
};

export default icon;
