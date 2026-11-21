import type { PixelIcon } from "../types";

// Real estate: a tall building with a small house leaning on it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "real-estate-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...#",
    ".#.#.#",
    ".#...#.##",
    ".#...##..#",
    ".#.#.#....#",
    ".#...#....#",
    ".#...#.##.#",
    ".#...#.##.#",
    ".##########",
  ],
};

export default icon;
