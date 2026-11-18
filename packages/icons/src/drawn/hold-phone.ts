import type { PixelIcon } from "../types";

// Hand holding a phone upright: the offering hand of the set under a phone in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hold-phone",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......oooo",
    "......o..o",
    "......o..o",
    "......o..o",
    "......o..o",
    "......oooo",
    "....#.oooo",
    "#..#",
    "#.#########",
    "#.####",
    "#.########",
  ],
};

export default icon;
