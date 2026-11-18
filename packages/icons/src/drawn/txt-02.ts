import type { PixelIcon } from "../types";

// TXT file: the top of `file-01` over the letters T, X and T in the secondary tone, as in `wav-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "txt-02",
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
    ".ooo.o.o.ooo",
    "..o..o.o..o",
    "..o...o...o",
    "..o..o.o..o",
    "..o..o.o..o",
  ],
};

export default icon;
