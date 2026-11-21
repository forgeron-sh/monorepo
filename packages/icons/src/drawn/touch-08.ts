import type { PixelIcon } from "../types";

// Touch from the side, left hand: `touch-07` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "touch-08",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#",
    ".o...#",
    "o.....#",
    "o.######",
    "o....####.#",
    ".o..#####.#",
    ".....####.#",
    "....#####.#",
    ".....####.#",
    "....####",
  ],
};

export default icon;
