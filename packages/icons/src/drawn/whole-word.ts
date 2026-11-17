import type { PixelIcon } from "../types";

// Match whole word: the letters a and b over a bracket in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "whole-word",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".......#",
    ".......#",
    "..###..###",
    ".....#.#..#",
    "..####.#..#",
    ".#...#.#..#",
    "..####.###",
    "o..........o",
    "oooooooooooo",
  ],
};

export default icon;
