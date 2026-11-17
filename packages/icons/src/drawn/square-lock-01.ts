import type { PixelIcon } from "../types";

// Padlock in a box: a solid body with its keyhole cut out, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-lock-01",
  implemented: true,
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
    ".#.oooooo.#",
    ".#.oo..oo.#",
    ".#.oooooo.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
