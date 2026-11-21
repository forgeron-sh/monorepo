import type { PixelIcon } from "../types";

// Square with a pair of code chevrons inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "code-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#..o..o..#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".#..o..o..#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
