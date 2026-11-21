import type { PixelIcon } from "../types";

// A box open at its lower left and an arrow leaving it, `link-square-02` turned half round.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-out-down-left",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "...#......#",
    "...#......#",
    "...#......#",
    "......o...#",
    ".....o....#",
    ".o..o.....#",
    ".o.o...####",
    ".oo",
    ".oooo",
  ],
};

export default icon;
