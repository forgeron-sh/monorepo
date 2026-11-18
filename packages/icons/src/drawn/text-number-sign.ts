import type { PixelIcon } from "../types";

// Number sign: a capital N followed by a raised small o, underlined, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-number-sign",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "#....#..oo",
    "##...#.o..o",
    "#.#..#.o..o",
    "#..#.#..oo",
    "#...##",
    "#....#.oooo",
  ],
};

export default icon;
