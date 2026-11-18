import type { PixelIcon } from "../types";

// Vertical reload: the loop of two arrows of `repeat`, turned a quarter.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-reload-vertical",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...###..#",
    "...#...###",
    "...#..#.#.#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    ".#.#.#..#",
    "..###...#",
    "...#..###",
  ],
};

export default icon;
