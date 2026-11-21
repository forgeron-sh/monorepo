import type { PixelIcon } from "../types";

// Balloon whisk: outer and inner wire loops over a handle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "whisk",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#.##.#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#.#..#.#",
    "...#.##.#",
    "....#..#",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
