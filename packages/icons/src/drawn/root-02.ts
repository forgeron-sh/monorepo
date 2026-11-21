import type { PixelIcon } from "../types";

// Square root: the radical sign with its overline, the quantity under it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "root-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#####",
    ".....#",
    ".....#....oo",
    "....#.....oo",
    "....#",
    "...#",
    "...#",
    "#.#",
    ".##",
    "..#",
  ],
};

export default icon;
