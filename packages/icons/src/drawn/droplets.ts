import type { PixelIcon } from "../types";

// Two water drops: a large one and a small one above it to the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "droplets",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........##",
    "........#..#",
    "...#....#..#",
    "..#.#....##",
    ".#...#",
    ".#...#",
    "#.....#",
    "#.....#",
    "#.....#",
    ".#...#",
    "..###",
  ],
};

export default icon;
