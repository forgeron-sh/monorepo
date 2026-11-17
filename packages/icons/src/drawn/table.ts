import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`table`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "table",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "############",
    "#o.o#o.o.o.#",
    "#.o.#.o.o.o#",
    "############",
    "#...#......#",
    "#.#.#.#.##.#",
    "#...#......#",
    "#...#......#",
    "#.#.#oooooo#",
    "#...#oooooo#",
    "#...#......#",
    "############",
  ],
};

export default icon;
