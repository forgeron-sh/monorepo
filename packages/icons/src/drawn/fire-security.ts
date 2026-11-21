import type { PixelIcon } from "../types";

// Shield with a flame inside in the secondary tone, fire safety (the shield of shield-01).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fire-security",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...o....#",
    ".#...oo...#",
    ".#..o.o.o.#",
    ".#..o..oo.#",
    "..#.o..o.#",
    "...#.oo.#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
