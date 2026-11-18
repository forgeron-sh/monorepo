import type { PixelIcon } from "../types";

// Square with a capital C in the secondary tone, for a call option.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "options-call",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..oooo..#",
    ".#.o....o.#",
    ".#.o......#",
    ".#.o......#",
    ".#.o....o.#",
    ".#..oooo..#",
    ".#........#",
    "..########",
  ],
};

export default icon;
