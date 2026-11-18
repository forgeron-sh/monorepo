import type { PixelIcon } from "../types";

// A stocks app: a zigzag price line inside a rounded square.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "apple-stocks",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "#..........#",
    "#..........#",
    "#.......#..#",
    "#.......#..#",
    "#...#..#.#.#",
    "#..#.##....#",
    "#..#..#....#",
    "#.#........#",
    "#..........#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
