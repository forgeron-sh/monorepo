import type { PixelIcon } from "../types";

// Touch, left hand: `touch-01` mirrored, the fingertip inside a ring in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "touch-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......ooo",
    ".....o...o",
    ".....o...o",
    ".....o.#.o",
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
