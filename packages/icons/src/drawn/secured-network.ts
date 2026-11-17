import type { PixelIcon } from "../types";

// Secured network: a small shield above two linked nodes, the links of `network` in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "secured-network",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    "....#..#",
    ".....##",
    "...o....o",
    "..o......o",
    "..o......o",
    ".###....###",
    ".#.#oooo#.#",
    ".###....###",
  ],
};

export default icon;
