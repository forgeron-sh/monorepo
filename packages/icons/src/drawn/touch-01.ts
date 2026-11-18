import type { PixelIcon } from "../types";

// Touch: the fingertip of the pointing hand inside a ring in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "touch-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...ooo",
    "..o...o",
    "..o...o",
    "..o.#.o",
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
