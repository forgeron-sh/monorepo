import type { PixelIcon } from "../types";

// Lollipop: a round candy with a swirl in the secondary tone on a 45° stick.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lollipop",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "..#..oo..#",
    "..#.o..o.#",
    "..#.o..o.#",
    "..#..oo..#",
    "...#....#",
    "....####",
    "...#",
    "..#",
    ".#",
  ],
};

export default icon;
