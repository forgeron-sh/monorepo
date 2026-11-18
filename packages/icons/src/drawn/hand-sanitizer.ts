import type { PixelIcon } from "../types";

// Hand sanitizer: a pump bottle with a drop in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand-sanitizer",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..######",
    ".....##",
    "....####",
    "...#....#",
    "..#......#",
    "..#..oo..#",
    "..#.oooo.#",
    "..#.oooo.#",
    "..#..oo..#",
    "..#......#",
    "..########",
  ],
};

export default icon;
