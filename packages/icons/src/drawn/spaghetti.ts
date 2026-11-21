import type { PixelIcon } from "../types";

// A plate of spaghetti, a fork standing in the pile.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "spaghetti",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#.#.#",
    "....#.#.#",
    "....#####",
    "......#",
    "...oo.#.oo",
    "..o..o#o..o",
    ".o.oo.#.oo.o",
    ".oooooooooo",
    "",
    "############",
  ],
};

export default icon;
