import type { PixelIcon } from "../types";

// Warm thermometer: the liquid, in the secondary tone, risen to the top; the thermometer of thermometer.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "thermometer-warm",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#oo#",
    "....#oo#",
    "....#oo#",
    "....#oo#",
    "....#oo#",
    "...#.oo.#",
    "...#oooo#",
    "...#.oo.#",
    "....####",
  ],
};

export default icon;
