import type { PixelIcon } from "../types";

// The X mark inside a coin ring.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "new-twitter-ellipse",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    "..#......#",
    ".#.##...#.#",
    "#...##.#...#",
    "#....##....#",
    "#....##....#",
    "#...#.##...#",
    "#..#...##..#",
    "#.#.....##.#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
