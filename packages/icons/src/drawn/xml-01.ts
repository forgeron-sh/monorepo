import type { PixelIcon } from "../types";

// XML file: the top of `file-01` over the letters X, M and L in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "xml-01",
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
    ".o.o.o.o.o",
    ".o.o.ooo.o",
    "..o..o.o.o",
    ".o.o.o.o.o",
    ".o.o.o.o.ooo",
  ],
};

export default icon;
