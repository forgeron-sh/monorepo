import type { PixelIcon } from "../types";

// XSL file: the top of `file-01` over the letters X, S and L in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "xsl-01",
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
    ".o.o..oo.o",
    ".o.o.o...o",
    "..o...o..o",
    ".o.o...o.o",
    ".o.o.oo..ooo",
  ],
};

export default icon;
