import type { PixelIcon } from "../types";

// Language: a letter A in the secondary tone inside the full-grid ring of `circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "language-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#...oo...#",
    "#...o..o...#",
    "#..o....o..#",
    "#..oooooo..#",
    "#..o....o..#",
    ".#.o....o.#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
