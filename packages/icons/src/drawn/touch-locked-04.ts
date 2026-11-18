import type { PixelIcon } from "../types";

// Touch unlocked, left hand: `touch-locked-02` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "touch-locked-04",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".ooo",
    "...o",
    "ooooo",
    "ooooo..#",
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
