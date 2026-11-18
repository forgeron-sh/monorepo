import type { PixelIcon } from "../types";

// Swipe left: `swipe-right-09` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-left-09",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....ooooo",
    ".o.o.....o",
    ".oo.......o",
    ".ooo...#",
    ".......#",
    ".#.#.#.#..#",
    ".#######.#",
    ".########",
    ".#######",
    "..#####",
    "",
    "..#####",
  ],
};

export default icon;
