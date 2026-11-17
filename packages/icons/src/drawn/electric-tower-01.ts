import type { PixelIcon } from "../types";

// A power line pylon with its cross-arm.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "electric-tower-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    ".##########",
    ".#..#..#..#",
    "....#..#",
    "...#.##.#",
    "...#.##.#",
    "..#.#..#.#",
    "..##....##",
    ".#........#",
  ],
};

export default icon;
