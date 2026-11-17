import type { PixelIcon } from "../types";

// Guitar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "guitar",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........##",
    ".........##",
    "........#",
    ".......#",
    "...###.#",
    "..#...#",
    ".#.....#",
    ".#..o..#",
    ".#.....#",
    "..#...#",
    "...###",
  ],
};

export default icon;
