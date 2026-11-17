import type { PixelIcon } from "../types";

// A pointer arrow and an hourglass badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-progress-01",
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
    ".###..ooooo",
    ".#.#...o.o",
    "........o",
    ".......o.o",
    "......ooooo",
  ],
};

export default icon;
