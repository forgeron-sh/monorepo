import type { PixelIcon } from "../types";

// Search and replace: a magnifier with a return arrow in the secondary tone in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "search-replace",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".####",
    "#....#",
    "#....#",
    "#....#",
    "#....#",
    ".#####",
    "......#",
    "...........o",
    "...........o",
    "........o..o",
    ".......ooooo",
    "........o",
  ],
};

export default icon;
