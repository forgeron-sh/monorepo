import type { PixelIcon } from "../types";

// Rose: a closed bloom on a stem with one leaf.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rose",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#..#.#",
    "...#.#..#",
    "...#....#",
    "....####",
    ".....#",
    "..##.#",
    "...###",
    ".....#",
    ".....#",
  ],
};

export default icon;
