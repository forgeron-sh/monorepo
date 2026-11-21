import type { PixelIcon } from "../types";

// Ketupat: the woven diamond rice pouch, its weave in the secondary tone, two leaf ends at the top.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "ketupat",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".......##",
    "......#",
    ".....##",
    "....#..#",
    "...#.oo.#",
    "..#.o..o.#",
    ".#.o....o.#",
    "..#.o..o.#",
    "...#.oo.#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
