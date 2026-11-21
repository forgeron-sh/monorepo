import type { PixelIcon } from "../types";

// Pointing left: `pointing-right-04` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pointing-left-04",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...o..o",
    "..o..o",
    "...o..o",
    "",
    "..######",
    ".....####.#",
    "....#####.#",
    ".....####.#",
    "....#####.#",
    ".....####.#",
    "....####",
  ],
};

export default icon;
