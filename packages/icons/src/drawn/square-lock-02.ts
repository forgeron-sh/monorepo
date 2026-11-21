import type { PixelIcon } from "../types";

// Outline padlock in a box, the padlock in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-lock-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..oooo..#",
    ".#..o..o..#",
    ".#.oooooo.#",
    ".#.o....o.#",
    ".#.o.oo.o.#",
    ".#.oooooo.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
