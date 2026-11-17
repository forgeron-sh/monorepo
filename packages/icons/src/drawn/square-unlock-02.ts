import type { PixelIcon } from "../types";

// `square-lock-02` opened: the outline padlock with its shackle raised, its right leg free of a shorter body.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-unlock-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..oooo..#",
    ".#..o.....#",
    ".#..o.....#",
    ".#.oooooo.#",
    ".#.o.oo.o.#",
    ".#.oooooo.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
