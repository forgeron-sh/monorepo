import type { PixelIcon } from "../types";

// Pointing right: the pointing hand of the set with the thumb folded, under a long arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pointing-right-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........o",
    ".ooooooo.o",
    "........o",
    "",
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
