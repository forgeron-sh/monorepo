import type { PixelIcon } from "../types";

// Square root in braces: the radical of `square-radical` in the secondary tone between two curly brackets.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "root-2nd-bracket",
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
    "#....o.....#",
    "#....o.....#",
    ".#.oo.....#",
    ".#..o.....#",
    ".#........#",
    "..#......#",
  ],
};

export default icon;
