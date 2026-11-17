import type { PixelIcon } from "../types";

// Percent sign in the full-grid ring of `circle`, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "percent-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#.oo...o.#",
    "#..oo..o...#",
    "#.....o....#",
    "#....o.....#",
    "#...o..oo..#",
    ".#.o...oo.#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
