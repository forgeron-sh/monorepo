import type { PixelIcon } from "../types";

// Detergent bottle: a cap, sloped shoulders, a label in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "detergent",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    "...#....#",
    "..#......#",
    "..#......#",
    "..#.oooo.#",
    "..#.oooo.#",
    "..#......#",
    "..#......#",
    "..########",
  ],
};

export default icon;
