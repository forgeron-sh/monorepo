import type { PixelIcon } from "../types";

// CSS file: `file-01` one column left, a pair of curly braces as the badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "css-file-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...##",
    ".#...#.#",
    ".#...####",
    ".#......#",
    ".#",
    ".#......o.o",
    ".#......o.o",
    ".#.....o...o",
    ".#####..o.o",
    "........o.o",
  ],
};

export default icon;
