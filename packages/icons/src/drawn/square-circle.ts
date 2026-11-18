import type { PixelIcon } from "../types";

// Square with a ring inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..oooo..#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".#..oooo..#",
    ".#........#",
    "..########",
  ],
};

export default icon;
