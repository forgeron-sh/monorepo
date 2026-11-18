import type { PixelIcon } from "../types";

// Pointing left: `pointing-right-03` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pointing-left-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o..o",
    "o.o.ooooooo",
    "o..o",
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
