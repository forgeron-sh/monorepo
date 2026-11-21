import type { PixelIcon } from "../types";

// Thermometer with a scale: `thermometer` moved left, two scale marks on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "temperature",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##",
    "...#..#",
    "...#..#.##",
    "...#oo#",
    "...#oo#",
    "...#oo#.##",
    "..#.oo.#",
    "..#oooo#",
    "..#.oo.#",
    "...####",
  ],
};

export default icon;
