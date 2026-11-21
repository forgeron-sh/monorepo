import type { PixelIcon } from "../types";

// The small pointer of `cursor-loading-01` with a ring selection badge in the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-circle-selection-02",
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
    ".###...ooo",
    ".#.#..o...o",
    "......o...o",
    "......o...o",
    ".......ooo",
  ],
};

export default icon;
