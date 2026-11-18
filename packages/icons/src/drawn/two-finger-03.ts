import type { PixelIcon } from "../types";

// Peace sign: `two-finger-01` with the two raised fingers spread apart.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "two-finger-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#.....#",
    "...#...#",
    "....#.#",
    "....#.#.#.#",
    "....#######",
    "....#######",
    "....#######",
    ".....#####",
    "",
    ".....#####",
  ],
};

export default icon;
