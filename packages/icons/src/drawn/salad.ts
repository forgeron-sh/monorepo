import type { PixelIcon } from "../types";

// Salad: a bowl with two leaves rising over the rim in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "salad",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "......oo",
    "..oo.o..o",
    ".o..oo...o",
    ".o...o...o",
    "############",
    "#..........#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
