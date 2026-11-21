import type { PixelIcon } from "../types";

// A pointer arrow and a cross badge: clear the selection.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-remove-selection-01",
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
    ".###..o...o",
    ".#.#...o.o",
    "........o",
    ".......o.o",
    "......o...o",
  ],
};

export default icon;
