import type { PixelIcon } from "../types";

// The congruence sign of `congruent-to` inside a square, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "congruent-to-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..oo..o.#",
    ".#.o..oo..#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
