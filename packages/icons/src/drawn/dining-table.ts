import type { PixelIcon } from "../types";

// Dining table: a table seen from the side, a serving cloche on it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "dining-table",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....oo",
    "...oo..oo",
    "..o......o",
    "..oooooooo",
    ".##########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
  ],
};

export default icon;
