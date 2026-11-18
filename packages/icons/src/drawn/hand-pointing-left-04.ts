import type { PixelIcon } from "../types";

// Hand pointing left: `hand-pointing-right-04` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hand-pointing-left-04",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".....####.#",
    "....#####.#",
    ".....####.#",
    "....#####.#",
    ".....####.#",
    "..######",
    "......#",
    ".....#",
    "....#",
  ],
};

export default icon;
