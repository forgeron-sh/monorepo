import type { PixelIcon } from "../types";

// Data transfer: a ring with two opposite horizontal arrows, the arrows in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-data-transfer-horizontal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#.....o..#",
    ".#.oooooo.#",
    ".#.....o..#",
    ".#..o.....#",
    ".#.oooooo.#",
    ".#..o.....#",
    "..#......#",
    "...######",
  ],
};

export default icon;
