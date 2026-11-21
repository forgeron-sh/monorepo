import type { PixelIcon } from "../types";

// Cellular mast: a mast with two arcs of waves each side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cellular-network",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#........#",
    "#..#....#..#",
    "#.#..##..#.#",
    "#.#..##..#.#",
    "#..#.##.#..#",
    ".#...##...#",
    ".....##",
    ".....##",
    ".....##",
    "....####",
  ],
};

export default icon;
