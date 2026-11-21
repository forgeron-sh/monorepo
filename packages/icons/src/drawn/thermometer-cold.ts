import type { PixelIcon } from "../types";

// Cold thermometer: the liquid, in the secondary tone, down in the bulb; the thermometer of thermometer.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "thermometer-cold",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    "...#.oo.#",
    "...#oooo#",
    "...#.oo.#",
    "....####",
  ],
};

export default icon;
