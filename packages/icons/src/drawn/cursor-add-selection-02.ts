import type { PixelIcon } from "../types";

// The small pointer of `cursor-loading-01` with a plus badge in the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-add-selection-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".##",
    ".###",
    ".####",
    ".#####",
    ".###....o",
    ".#.#....o",
    "......ooooo",
    "........o",
    "........o",
  ],
};

export default icon;
