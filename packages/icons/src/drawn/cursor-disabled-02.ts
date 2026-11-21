import type { PixelIcon } from "../types";

// The small pointer of `cursor-loading-01` with a no-entry badge in the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-disabled-02",
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
    ".#.#..o..oo",
    "......o.o.o",
    "......oo..o",
    ".......ooo",
  ],
};

export default icon;
