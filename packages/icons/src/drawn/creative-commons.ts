import type { PixelIcon } from "../types";

// The Creative Commons mark: two letters c inside a round ring.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "creative-commons",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    ".##......##",
    ".#........#",
    "#..........#",
    "#..##...##.#",
    "#.#....#...#",
    "#.#....#...#",
    "#..##...##.#",
    "#..........#",
    ".#........#",
    ".##......##",
    "...######",
  ],
};

export default icon;
