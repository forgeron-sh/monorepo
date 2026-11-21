import type { PixelIcon } from "../types";

// RAR file: the top of `file-01` over the letters R, A and R in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rar-01",
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
    ".oo..ooo.oo",
    ".o.o.o.o.o.o",
    ".oo..ooo.oo",
    ".o.o.o.o.o.o",
    ".o.o.o.o.o.o",
  ],
};

export default icon;
