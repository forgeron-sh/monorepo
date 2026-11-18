import type { PixelIcon } from "../types";

// Discover: the needle of `compass` in a square frame.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "discover-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#......o.#",
    ".#.....o..#",
    ".#...oo...#",
    ".#...##...#",
    ".#..#.....#",
    ".#.#......#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
