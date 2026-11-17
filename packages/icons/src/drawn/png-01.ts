import type { PixelIcon } from "../types";

// PNG file: the top of `file-01` over the letters P, N and G in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "png-01",
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
    ".ooo.oo...oo",
    ".o.o.o.o.o",
    ".ooo.o.o.o.o",
    ".o...o.o.o.o",
    ".o...o.o..oo",
  ],
};

export default icon;
