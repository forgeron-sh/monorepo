import type { PixelIcon } from "../types";

// A sigma in the secondary tone in the ring of `circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "summation-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#.oooooo.#",
    "#...o......#",
    "#....o.....#",
    "#....o.....#",
    "#...o......#",
    ".#.oooooo.#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
