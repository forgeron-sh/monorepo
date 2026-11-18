import type { PixelIcon } from "../types";

// The Amazon mark in pixels: the lowercase “a” over the smile that ends in an arrow.
// 12×12: `#` primary tone. Rasterised from `simple-icons:amazon` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Amazon and the Amazon logo are trademarks of Amazon.com, Inc., used here only to refer to Amazon.
const icon: PixelIcon = {
  name: "amazon",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    "......##",
    "...#####",
    "..##..##",
    "..##..##",
    "...###.##",
    "",
    "#.........##",
    ".##......#.#",
    "...######",
  ],
};

export default icon;
