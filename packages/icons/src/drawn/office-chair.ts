import type { PixelIcon } from "../types";

// Office chair seen from the side: backrest, seat, column and wheeled base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "office-chair",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###",
    ".#.#",
    ".#.#",
    ".#.#",
    ".###",
    "..#",
    ".##########",
    "......#",
    "......#",
    "...#######",
    "...#..#..#",
  ],
};

export default icon;
