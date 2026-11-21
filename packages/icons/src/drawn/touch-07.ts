import type { PixelIcon } from "../types";

// Touch from the side: `hand-pointing-right-01` pressing a short arc in the secondary tone at its fingertip.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "touch-07",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......#",
    "......#...o",
    ".....#.....o",
    "....######.o",
    ".#.####....o",
    ".#.#####..o",
    ".#.####",
    ".#.#####",
    ".#.####",
    "....####",
  ],
};

export default icon;
