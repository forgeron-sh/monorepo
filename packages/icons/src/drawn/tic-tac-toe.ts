import type { PixelIcon } from "../types";

// A tic-tac-toe grid with a cross and a nought.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tic-tac-toe",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o.o.#..#",
    ".o..#..#",
    "o.o.#..#",
    "....#..#",
    "############",
    "....#..#",
    "....#..#",
    "############",
    "....#..#",
    "....#..#..o",
    "....#..#.o.o",
    "....#..#..o",
  ],
};

export default icon;
