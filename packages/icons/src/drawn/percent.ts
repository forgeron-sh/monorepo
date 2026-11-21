import type { PixelIcon } from "../types";

// Percent: two small rings and a 45° bar, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "percent",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###......#",
    ".#.#.....#",
    ".###....#",
    ".......#",
    "......#",
    ".....#",
    "....#",
    "...#....###",
    "..#.....#.#",
    ".#......###",
  ],
};

export default icon;
