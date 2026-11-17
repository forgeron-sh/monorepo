import type { PixelIcon } from "../types";

// A box open at its upper left and an arrow leaving it, `link-square-02` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-out-up-left",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oooo",
    ".oo",
    ".o.o...####",
    ".o..o.....#",
    ".....o....#",
    "......o...#",
    "...#......#",
    "...#......#",
    "...#......#",
    "...########",
  ],
};

export default icon;
