import type { PixelIcon } from "../types";

// Shampoo: a pump bottle with a label.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shampoo",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    ".....##",
    "....####",
    "...#....#",
    "..#......#",
    "..#.oooo.#",
    "..#.oooo.#",
    "..#......#",
    "..#......#",
    "..########",
  ],
};

export default icon;
