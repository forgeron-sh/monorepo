import type { PixelIcon } from "../types";

// File with a badge of three signal bars rising to the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-signal",
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
    ".#",
    ".#........o",
    ".#........o",
    ".#......o.o",
    ".#......o.o",
    ".####.o.o.o",
  ],
};

export default icon;
