import type { PixelIcon } from "../types";

// Cat: a round head with two pointed ears, eyes in the secondary tone and a small nose.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cat",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##......##",
    ".#.#....#.#",
    ".#..####..#",
    ".#........#",
    "#..o....o..#",
    "#..o....o..#",
    "#....##....#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
