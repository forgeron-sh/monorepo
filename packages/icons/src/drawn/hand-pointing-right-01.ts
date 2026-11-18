import type { PixelIcon } from "../types";

// Hand pointing right: the pointing hand of the set turned a quarter turn, cuff on the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand-pointing-right-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......#",
    "......#",
    ".....#",
    "....######",
    ".#.####",
    ".#.#####",
    ".#.####",
    ".#.#####",
    ".#.####",
    "....####",
  ],
};

export default icon;
