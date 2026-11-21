import type { PixelIcon } from "../types";

// Touch, left hand: `touch-02` mirrored, three short rays above the fingertip.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "touch-04",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".......o",
    "....o..o..o",
    ".....o...o",
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
