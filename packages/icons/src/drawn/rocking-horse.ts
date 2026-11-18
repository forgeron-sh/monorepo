import type { PixelIcon } from "../types";

// Rocking horse: a horse's head and body on legs that stand on a curved rocker.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rocking-horse",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#",
    ".###",
    "####",
    "..##",
    "..#######.#",
    "..########",
    "..#.....#",
    "..#.....#",
    "#.#.....#.#",
    ".#########",
  ],
};

export default icon;
