import type { PixelIcon } from "../types";

// Tap with the left hand: `tap-01` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "tap-04",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......ooo",
    ".....o...o",
    "",
    ".......#",
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
