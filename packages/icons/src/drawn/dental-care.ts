import type { PixelIcon } from "../types";

// Dental care: the tooth drawing with a plus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dental-care",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....##",
    ".#..####..#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#..oooo..#",
    "..#..oo..#",
    "..#..##..#",
    "..#.#..#.#",
    "..#.#..#.#",
    "...#....#",
  ],
};

export default icon;
