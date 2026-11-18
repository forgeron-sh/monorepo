import type { PixelIcon } from "../types";

// Pagoda: two roofs with upturned eaves, a spire and a door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "china-temple",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    ".#..####..#",
    "..########",
    "...#....#",
    "#..#....#..#",
    ".##########",
    "..#......#",
    "..#..##..#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#.#..#.#",
    ".##########",
  ],
};

export default icon;
