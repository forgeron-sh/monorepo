import type { PixelIcon } from "../types";

// An apple: the round fruit in outline with its stem and a leaf.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "apple-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......#.##",
    "......##",
    "..###.#.###",
    ".#...#.#...#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    ".#........#",
    ".#........#",
    "..#..##..#",
    "...##..##",
  ],
};

export default icon;
