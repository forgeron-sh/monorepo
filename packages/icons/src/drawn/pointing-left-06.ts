import type { PixelIcon } from "../types";

// Pointing left: `pointing-right-06` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pointing-left-06",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..######",
    ".....####.#",
    "....#####.#",
    ".....####.#",
    "....#####.#",
    ".....####.#",
    "....####",
    "",
    "...o",
    "..o.ooooooo",
    "...o",
  ],
};

export default icon;
