import type { PixelIcon } from "../types";

// Activity in a square: the pulse line of `activity-01` running across a square frame.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "activity-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...#....#",
    ".#..#.#...#",
    ".#..#.#...#",
    ".###..#..##",
    ".#....#.#.#",
    ".#.....#..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
