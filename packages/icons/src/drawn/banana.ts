import type { PixelIcon } from "../types";

// Banana: a curved fruit with a stem at the top.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "banana",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........##",
    ".........#.#",
    ".........#.#",
    "........#..#",
    ".......#...#",
    "......#...#",
    ".....#...#",
    "###.#...#",
    ".#.....#",
    "..#####",
  ],
};

export default icon;
