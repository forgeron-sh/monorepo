import type { PixelIcon } from "../types";

// Picture in a frame with cut corners: one large mountain in one-pixel lines and the sun.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "image-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.##.....#",
    ".#.##.....#",
    ".#........#",
    ".#....#...#",
    ".#...#.#..#",
    ".#..#...#.#",
    ".#.#.....##",
    "..########",
  ],
};

export default icon;
