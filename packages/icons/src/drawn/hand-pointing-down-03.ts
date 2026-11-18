import type { PixelIcon } from "../types";

// Hand pointing down: `hand-pointing-down-01` with the thumb folded.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hand-pointing-down-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#####",
    "",
    ".....#####",
    "....#######",
    "....#######",
    "....#######",
    "....#.#.#.#",
    "....#",
    "....#",
  ],
};

export default icon;
