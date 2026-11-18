import type { PixelIcon } from "../types";

// Do not touch: `hand` crossed by a slash in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "do-not-touch-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...........o",
    "......#...o",
    "....#.#..o",
    "....#.#.o.#",
    ".#..#..o#.#",
    "..#.#.o####",
    "...#.o#####",
    "....o######",
    "...o.#####",
    "..o",
    ".o...#####",
    "o",
  ],
};

export default icon;
