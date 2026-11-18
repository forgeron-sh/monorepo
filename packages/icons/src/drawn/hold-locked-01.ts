import type { PixelIcon } from "../types";

// Hand holding a padlock: the offering hand of the set under a padlock in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hold-locked-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".......ooo",
    ".......o.o",
    "......ooooo",
    "......oo.oo",
    "......ooooo",
    "....#.ooooo",
    "#..#",
    "#.#########",
    "#.####",
    "#.########",
  ],
};

export default icon;
