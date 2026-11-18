import type { PixelIcon } from "../types";

// A hand pump with a lever, a spout and a drop.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "water-pump",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####..#",
    "....#..#.#",
    "....#..##",
    ".####..#",
    ".#..#..#",
    "....#..#",
    ".o..#..#",
    ".o..#..#",
    "....#..#",
    "..########",
  ],
};

export default icon;
