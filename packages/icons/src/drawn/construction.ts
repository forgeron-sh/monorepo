import type { PixelIcon } from "../types";

// Road barrier: a board with diagonal stripes in the secondary tone on two legs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "construction",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#......#",
    "############",
    "#..o..o..o.#",
    "#.o..o..o..#",
    "#o..o..o..o#",
    "############",
    "..#......#",
    "..#......#",
    "..#......#",
    ".###....###",
  ],
};

export default icon;
