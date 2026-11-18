import type { PixelIcon } from "../types";

// Touch locked: the pointing hand of the set beside a padlock in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "touch-locked-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........ooo",
    "........o.o",
    ".......ooooo",
    "....#..ooooo",
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
