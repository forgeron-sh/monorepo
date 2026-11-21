import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`chart`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "chart",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "#",
    "#.......###",
    "#.......#o#",
    "#.......#.#",
    "#....#o.#o#",
    "#....o#.#.#",
    "#....#o.#o#",
    "#.#o.o#.#.#",
    "#.o#.#o.#o#",
    "#.#o.o#.#.#",
    "############",
    ".#.#.#.#.#.#",
  ],
};

export default icon;
