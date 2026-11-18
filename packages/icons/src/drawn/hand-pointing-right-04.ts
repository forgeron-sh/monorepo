import type { PixelIcon } from "../types";

// Hand pointing right, palm side: `hand-pointing-right-01` turned over, the thumb underneath.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hand-pointing-right-04",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".#.####",
    ".#.#####",
    ".#.####",
    ".#.#####",
    ".#.####",
    "....######",
    ".....#",
    "......#",
    ".......#",
  ],
};

export default icon;
