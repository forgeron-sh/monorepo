import type { PixelIcon } from "../types";

// Yen sign in a ring: the full-grid ring of `circle`, the sign in the secondary tone, as in `euro-circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "yen-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#.oo..oo.#",
    "#...oooo...#",
    "#....oo....#",
    "#..oooooo..#",
    "#....oo....#",
    ".#.oooooo.#",
    ".#...oo...#",
    "..##....##",
    "....####",
  ],
};

export default icon;
