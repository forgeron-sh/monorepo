import type { PixelIcon } from "../types";

// Touch interaction: the pointing hand of the set pressing inside a frame in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "touch-interaction-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".ooooooo",
    ".o.....o",
    ".o.....o",
    ".o..#..o",
    "....#",
    ".#..#.#.#.#",
    "..#.#######",
    "...########",
    "....#######",
    ".....#####",
    "",
    ".....#####",
  ],
};

export default icon;
