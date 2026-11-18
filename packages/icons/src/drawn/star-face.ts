import type { PixelIcon } from "../types";

// Star of the set with a smiling face inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "star-face",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    "####....####",
    ".#..o..o..#",
    "..#......#",
    "..#.o..o.#",
    ".#...oo...#",
    ".#..#..#..#",
    ".###....###",
  ],
};

export default icon;
