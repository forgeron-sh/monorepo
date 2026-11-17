import type { PixelIcon } from "../types";

// XLS file: the top of `file-01` over the letters X, L and S in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "xls-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    "..#...##",
    "..#...#.#",
    "..#...####",
    "..#......#",
    "",
    ".o.o.o....oo",
    ".o.o.o...o",
    "..o..o....o",
    ".o.o.o.....o",
    ".o.o.ooo.oo",
  ],
};

export default icon;
