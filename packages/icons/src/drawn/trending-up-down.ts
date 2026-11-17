import type { PixelIcon } from "../types";

// Trending up and down: two crossing lines, one rising, one falling, each with an arrowhead.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "trending-up-down",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#......###",
    "..#......##",
    "...#....#.#",
    "....#..#",
    ".....##",
    ".....##",
    "....#..#",
    "...#....#.#",
    "..#......##",
    ".#......###",
  ],
};

export default icon;
