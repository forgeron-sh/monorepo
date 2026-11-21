import type { PixelIcon } from "../types";

// Pointing left: `pointing-right-08` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pointing-left-08",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...o",
    "..o.ooo",
    "...o",
    "",
    "....####",
    ".....####.#",
    "....#####.#",
    ".....####.#",
    "....#####.#",
    ".....####.#",
    "..######",
  ],
};

export default icon;
