import type { PixelIcon } from "../types";

// Check mark in one-pixel lines, lighter than `tick-01`: a long 45° arm and a short one meeting low on
// the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tick-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..........#",
    ".........#",
    "........#",
    ".#.....#",
    "..#...#",
    "...#.#",
    "....#",
  ],
};

export default icon;
