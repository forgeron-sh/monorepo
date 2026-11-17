import type { PixelIcon } from "../types";

// Images: an image frame in front of a second one offset up and right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "images",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "...#......#",
    ".########.#",
    ".#......#.#",
    ".#....#.#.#",
    ".#......#.#",
    ".#......#.#",
    ".#..#...###",
    ".#.###.##",
    ".########",
  ],
};

export default icon;
