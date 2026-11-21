import type { PixelIcon } from "../types";

// Pointing right: the pointing hand of the set with the thumb folded, under a short arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pointing-right-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........o",
    ".....ooo.o",
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
