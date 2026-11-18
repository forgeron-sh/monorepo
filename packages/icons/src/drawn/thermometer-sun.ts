import type { PixelIcon } from "../types";

// Thermometer with a sun, in the secondary tone, at its upper right; the thermometer of thermometer, moved left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "thermometer-sun",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##...o.o.o",
    ".#..#...ooo",
    ".#..#..ooooo",
    ".####...ooo",
    ".####..o.o.o",
    ".####",
    "#.##.#",
    "######",
    "#.##.#",
    ".####",
  ],
};

export default icon;
