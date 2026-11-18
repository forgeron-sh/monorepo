import type { PixelIcon } from "../types";

// Touch interaction, left hand: `touch-interaction-03` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "touch-interaction-04",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....ooooooo",
    "....o.....o",
    "....o.....o",
    "....o..#..o",
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
