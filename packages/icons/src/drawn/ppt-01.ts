import type { PixelIcon } from "../types";

// PPT file: the top of `file-01` over the letters P, P and T in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ppt-01",
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
    ".ooo.ooo.ooo",
    ".o.o.o.o..o",
    ".ooo.ooo..o",
    ".o...o....o",
    ".o...o....o",
  ],
};

export default icon;
