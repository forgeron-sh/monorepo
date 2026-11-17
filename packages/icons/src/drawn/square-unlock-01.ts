import type { PixelIcon } from "../types";

// `square-lock-01` opened: the shackle raised, its right leg free of a shorter body.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-unlock-01",
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
    ".#..o.....#",
    ".#.oooooo.#",
    ".#.oo..oo.#",
    ".#.oooooo.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
