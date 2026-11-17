import type { PixelIcon } from "../types";

// Blood bag: a hanging pouch with a drop in the secondary tone and a tube below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "blood-bag",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#..oo..#",
    "..#.oooo.#",
    "..#.oooo.#",
    "..#..oo..#",
    "..#......#",
    "...#....#",
    "....####",
    ".....##",
    ".....##",
  ],
};

export default icon;
