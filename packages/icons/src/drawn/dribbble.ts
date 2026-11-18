import type { PixelIcon } from "../types";

// The Dribbble mark: a basketball, a ring crossed by three curved seams.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "dribbble",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    ".##.#....##",
    ".#...#..###",
    "#....#.##..#",
    "#....###...#",
    "######.#...#",
    "#....######",
    "#...#..#...#",
    "#..#...#...#",
    ".##.....#.#",
    ".##.....###",
    "...######",
  ],
};

export default icon;
