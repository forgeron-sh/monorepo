import type { PixelIcon } from "../types";

// Submerge: an arrow in the secondary tone pointing down into two rows of waves.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "submerge",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....oo",
    ".....oo",
    "..o..oo..o",
    "...o.oo.o",
    "....oooo",
    ".....oo",
    "",
    ".##..##..##",
    "#..##..##..#",
    "",
    ".##..##..##",
    "#..##..##..#",
  ],
};

export default icon;
