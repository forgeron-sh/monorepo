import type { PixelIcon } from "../types";

// Hand offering a capsule: the offering hand of the set under a pill in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "give-pill",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "",
    "......oo.oo",
    ".....ooo.ooo",
    "....#.oo.oo",
    "#..#",
    "#.#########",
    "#.####",
    "#.########",
  ],
};

export default icon;
