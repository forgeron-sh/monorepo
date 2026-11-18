import type { PixelIcon } from "../types";

// Hand holding a document: the offering hand of the set under a page with two lines in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hold-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......oooooo",
    "......o....o",
    "......o.oo.o",
    "......o....o",
    "......o.oo.o",
    "......o....o",
    "....#.oooooo",
    "#..#",
    "#.#########",
    "#.####",
    "#.########",
  ],
};

export default icon;
