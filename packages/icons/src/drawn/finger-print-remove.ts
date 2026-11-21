import type { PixelIcon } from "../types";

// A fingerprint and a cross badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "finger-print-remove",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..####..#",
    ".#.#....#.#",
    ".#.#.##",
    "...#.#o...o",
    "..#..#.o.o",
    "..#..#..o",
    ".#..#..o.o",
    "....#.o...o",
  ],
};

export default icon;
