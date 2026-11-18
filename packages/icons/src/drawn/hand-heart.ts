import type { PixelIcon } from "../types";

// Hand holding a heart: the offering hand of the set with a heart in the secondary tone above the fingers.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand-heart",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "......oo.oo",
    "......ooooo",
    "......ooooo",
    ".......ooo",
    "....#...o",
    "#..#",
    "#.#########",
    "#.####",
    "#.########",
  ],
};

export default icon;
