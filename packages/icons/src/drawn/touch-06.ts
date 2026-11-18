import type { PixelIcon } from "../types";

// Touch: the pointing hand of the set with the thumb folded, three short rays above the fingertip.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "touch-06",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....o",
    ".o..o..o",
    "..o...o",
    "....#",
    "....#",
    "....#.#.#.#",
    "....#######",
    "....#######",
    "....#######",
    ".....#####",
    "",
    ".....#####",
  ],
};

export default icon;
