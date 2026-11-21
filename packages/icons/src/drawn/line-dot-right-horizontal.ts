import type { PixelIcon } from "../types";

// Horizontal line ending in a round dot on the right, the dot in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "line-dot-right-horizontal",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    ".........oo",
    "#######.oooo",
    "#######.oooo",
    ".........oo",
  ],
};

export default icon;
