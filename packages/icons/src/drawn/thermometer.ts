import type { PixelIcon } from "../types";

// Thermometer: a tube and a bulb, the mercury in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "thermometer",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
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
