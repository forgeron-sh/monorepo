import type { PixelIcon } from "../types";

// Square root in square brackets: the radical of `square-radical` in the secondary tone between two square brackets.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "root-3rd-bracket",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##......##",
    ".#........#",
    ".#....ooo.#",
    ".#....o...#",
    ".#...o....#",
    ".#...o....#",
    ".#.oo.....#",
    ".#..o.....#",
    ".#........#",
    ".##......##",
  ],
};

export default icon;
