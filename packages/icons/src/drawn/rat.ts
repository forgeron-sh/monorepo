import type { PixelIcon } from "../types";

// Rat seen from the side: a round back, a pointed snout, a big rounded ear and a long tail.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "rat",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".......##",
    "......#..#",
    "....###..#",
    "...#....#.#",
    "..#........#",
    "..#.......##",
    "..#########",
    ".#..#...#",
    "#",
  ],
};

export default icon;
