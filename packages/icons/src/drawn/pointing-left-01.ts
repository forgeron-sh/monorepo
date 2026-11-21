import type { PixelIcon } from "../types";

// Pointing left: `pointing-right-01` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pointing-left-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...o",
    "..o.ooooooo",
    "...o",
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
