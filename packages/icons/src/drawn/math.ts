import type { PixelIcon } from "../types";

// Math: plus, minus, times and equals in the four quarters.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "math",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..#",
    "..#",
    "#####..#####",
    "..#",
    "..#",
    "",
    "",
    "#...#",
    ".#.#...#####",
    "..#",
    ".#.#...#####",
    "#...#",
  ],
};

export default icon;
