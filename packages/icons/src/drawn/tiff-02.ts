import type { PixelIcon } from "../types";

// TIFF file: the top of `file-01` over the letters T, I, F and F of `tiff-01` in the secondary tone, as in `wav-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tiff-02",
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
    "ooo.o.oo.oo",
    ".o..o.o..o",
    ".o..o.oo.oo",
    ".o..o.o..o",
    ".o..o.o..o",
  ],
};

export default icon;
