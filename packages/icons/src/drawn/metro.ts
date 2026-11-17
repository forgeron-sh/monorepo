import type { PixelIcon } from "../types";

// Metro sign: an M in the secondary tone in the full-grid ring of `circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "metro",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#.o....o.#",
    "#..oo..oo..#",
    "#..o.oo.o..#",
    "#..o....o..#",
    "#..o....o..#",
    ".#.o....o.#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
