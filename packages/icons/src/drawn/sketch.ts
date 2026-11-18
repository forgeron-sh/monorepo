import type { PixelIcon } from "../types";

// The Sketch mark in pixels: the cut gem with its row of facets on top.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "sketch",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".##.####.##",
    "##...##...##",
    "############",
    ".#.######.#",
    "..#.####.#",
    "...#.##.#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
