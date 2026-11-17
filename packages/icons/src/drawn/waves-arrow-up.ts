import type { PixelIcon } from "../types";

// Waves with an arrow up: `submerge` turned over, the arrow in the secondary tone rising out of two rows of waves.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "waves-arrow-up",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....oo",
    "....oooo",
    "...o.oo.o",
    "..o..oo..o",
    ".....oo",
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
