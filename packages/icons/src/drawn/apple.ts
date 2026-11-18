import type { PixelIcon } from "../types";

// The Apple logo in pixels: the apple with its bite on the right and its leaf above.
// 12×12: `#` primary tone. Rasterised from `simple-icons:apple` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Apple and the Apple logo are trademarks of Apple Inc., used here only to refer to Apple.
const icon: PixelIcon = {
  name: "apple",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".......##",
    "......##",
    "",
    "..####.###",
    ".##########",
    ".########",
    ".#######",
    ".########",
    ".##########",
    ".##########",
    "..########",
    "...##..##",
  ],
};

export default icon;
