import type { PixelIcon } from "../types";

// A pointer arrow and a sparkle badge: magic selection.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-magic-selection-01",
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
    ".#.#...ooo",
    "......ooooo",
    ".......ooo",
    "........o",
  ],
};

export default icon;
