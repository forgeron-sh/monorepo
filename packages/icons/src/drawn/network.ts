import type { PixelIcon } from "../types";

// Network: three nodes in a triangle, a four-pixel node on top, joined by links in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "network",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    "....#..#",
    "....####",
    "...o....o",
    "..o......o",
    "..o......o",
    ".###....###",
    ".#.#oooo#.#",
    ".###....###",
  ],
};

export default icon;
