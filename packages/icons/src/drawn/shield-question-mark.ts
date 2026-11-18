import type { PixelIcon } from "../types";

// Shield with a question mark in the secondary tone; the shield-plus base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shield-question-mark",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#..oooo..#",
    ".#......o.#",
    ".#....oo..#",
    ".#...o....#",
    ".#........#",
    "..#..o...#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
