import type { PixelIcon } from "../types";

// A ring around two opposite diagonal arrows in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "circle-arrow-data-transfer-diagonal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#.ooo..#",
    ".#...oo...#",
    ".#..o.o...#",
    ".#.o......#",
    ".#......o.#",
    ".#...o.o..#",
    ".#...oo...#",
    "..#..ooo.#",
    "...######",
  ],
};

export default icon;
