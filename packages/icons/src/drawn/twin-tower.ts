import type { PixelIcon } from "../types";

// Twin towers (Petronas): two spired towers linked by a skybridge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "twin-tower",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..#......#",
    "..#......#",
    ".###....###",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.#oooo#.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".###....###",
  ],
};

export default icon;
