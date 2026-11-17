import type { PixelIcon } from "../types";

// Canvas on an easel: a framed board with a small mountain in the secondary tone, on splayed legs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "canvas",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".##########",
    ".#........#",
    ".#....o...#",
    ".#...o.o..#",
    ".#..o...o.#",
    ".##########",
    "...#....#",
    "..#......#",
    ".#........#",
  ],
};

export default icon;
