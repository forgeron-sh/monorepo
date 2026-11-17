import type { PixelIcon } from "../types";

// Super intelligence: the letters S and I in a rounded square.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "super-intelligence",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.####.#.#",
    ".#.#....#.#",
    ".#.####.#.#",
    ".#....#.#.#",
    ".#.####.#.#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
