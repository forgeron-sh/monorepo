import type { PixelIcon } from "../types";

// File with a link badge: a slanted chain link.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-link",
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
    ".#.......oo",
    ".#......o.o",
    ".#.....o.o",
    ".#....o.o",
    ".####.oo",
  ],
};

export default icon;
