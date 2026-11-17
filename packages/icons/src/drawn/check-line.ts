import type { PixelIcon } from "../types";

// Check mark over a line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "check-line",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........#",
    ".........#",
    "........#",
    ".#.....#",
    "..#...#",
    "...#.#",
    "....#",
    "",
    "",
    ".oooooooooo",
  ],
};

export default icon;
