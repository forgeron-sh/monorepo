import type { PixelIcon } from "../types";

// A scalloped badge with a question mark.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "badge-question-mark",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "..###..###",
    "..#.ooo..#",
    "..#....o.#",
    ".#....o...#",
    ".#...o....#",
    "..#......#",
    "..#..o...#",
    "..###..###",
    ".....##",
  ],
};

export default icon;
