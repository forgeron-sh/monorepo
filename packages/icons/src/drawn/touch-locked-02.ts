import type { PixelIcon } from "../types";

// Touch unlocked: the pointing hand of the set beside an open padlock in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "touch-locked-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........ooo",
    "........o",
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
