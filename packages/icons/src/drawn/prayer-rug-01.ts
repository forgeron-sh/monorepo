import type { PixelIcon } from "../types";

// Prayer rug: a rectangle with fringes at both ends and a pointed niche in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "prayer-rug-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..#.#..#.#",
    "..########",
    "..#......#",
    "..#..oo..#",
    "..#.o..o.#",
    "..#.o..o.#",
    "..#.o..o.#",
    "..#.o..o.#",
    "..#.oooo.#",
    "..#......#",
    "..########",
    "..#.#..#.#",
  ],
};

export default icon;
