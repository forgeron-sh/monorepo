import type { PixelIcon } from "../types";

// Brick wall: three courses of bricks with staggered joints.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "brick-wall",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#...#....#",
    ".#...#....#",
    ".##########",
    ".#.#...#..#",
    ".#.#...#..#",
    ".##########",
    ".#...#....#",
    ".#...#....#",
    ".##########",
  ],
};

export default icon;
