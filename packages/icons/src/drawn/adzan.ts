import type { PixelIcon } from "../types";

// Adzan: a minaret with two balconies and a pointed cap, sound waves in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "adzan",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#",
    "..#.#.....o",
    ".#####.o...o",
    "..#.#...o..o",
    "..#.#...o..o",
    "..#.#..o...o",
    ".#####....o",
    "..#.#",
    "..#.#",
    "..#.#",
    "..#.#",
    ".#####",
  ],
};

export default icon;
