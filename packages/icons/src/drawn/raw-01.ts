import type { PixelIcon } from "../types";

// RAW file: the top of `file-01` over the letters R, A and W in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "raw-01",
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
    ".oo..ooo.o.o",
    ".o.o.o.o.o.o",
    ".oo..ooo.o.o",
    ".o.o.o.o.ooo",
    ".o.o.o.o.o.o",
  ],
};

export default icon;
