import type { PixelIcon } from "../types";

// Trophy: a cup with two handles on a stem and a base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "trophy",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".##......##",
    "#.#......#.#",
    "#.#......#.#",
    ".##......##",
    "...#....#",
    "....#..#",
    ".....##",
    "....####",
    "...######",
  ],
};

export default icon;
