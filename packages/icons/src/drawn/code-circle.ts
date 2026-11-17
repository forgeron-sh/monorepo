import type { PixelIcon } from "../types";

// Code in a circle: two angle brackets in the secondary tone inside a ring.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "code-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#..o..o..#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".#..o..o..#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
