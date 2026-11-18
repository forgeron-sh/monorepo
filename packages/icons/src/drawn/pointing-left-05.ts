import type { PixelIcon } from "../types";

// Pointing left: `pointing-right-05` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pointing-left-05",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...o",
    "..o.ooo..oo",
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
