import type { PixelIcon } from "../types";

// A circle holding an equal sign.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "equal-sign-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#.oooooo.#",
    "#..oooooo..#",
    "#..........#",
    "#..........#",
    "#..oooooo..#",
    ".#.oooooo.#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
