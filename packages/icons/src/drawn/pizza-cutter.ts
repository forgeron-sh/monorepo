import type { PixelIcon } from "../types";

// Pizza cutter: a wheel with its axle in the secondary tone, a handle rising from the axle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pizza-cutter",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........#",
    ".........#",
    "........#",
    ".......#",
    "..###.#",
    ".#...#",
    "#...#.#",
    "#..o..#",
    "#.....#",
    ".#...#",
    "..###",
  ],
};

export default icon;
