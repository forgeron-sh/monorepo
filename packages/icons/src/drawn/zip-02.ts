import type { PixelIcon } from "../types";

// ZIP file: the top of `file-01` over the letters Z, I and P in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zip-02",
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
    "...o..o..o.o",
    "..o...o..ooo",
    ".o....o..o",
    ".ooo.ooo.o",
  ],
};

export default icon;
