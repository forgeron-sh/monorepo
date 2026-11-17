import type { PixelIcon } from "../types";

// PDF file: the top of `file-01` over the letters P, D and F in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pdf-02",
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
    ".ooo.oo..ooo",
    ".o.o.o.o.o",
    ".ooo.o.o.oo",
    ".o...o.o.o",
    ".o...oo..o",
  ],
};

export default icon;
