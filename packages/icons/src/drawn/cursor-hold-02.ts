import type { PixelIcon } from "../types";

// Pointer (the cursor-loading-01 base) with a clock in the secondary tone: press and hold.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "cursor-hold-02",
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
    ".###...oooo",
    ".#.#..o....o",
    "......o.o..o",
    "......o.oo.o",
    "......o....o",
    ".......oooo",
  ],
};

export default icon;
