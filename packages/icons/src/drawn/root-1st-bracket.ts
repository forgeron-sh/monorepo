import type { PixelIcon } from "../types";

// Square root in parentheses: the radical of `square-radical` in the secondary tone between two round brackets.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "root-1st-bracket",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#......#",
    ".#........#",
    ".#....ooo.#",
    ".#....o...#",
    ".#...o....#",
    ".#...o....#",
    ".#.oo.....#",
    ".#..o.....#",
    ".#........#",
    "..#......#",
  ],
};

export default icon;
