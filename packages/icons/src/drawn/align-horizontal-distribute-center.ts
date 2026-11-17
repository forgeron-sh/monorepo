import type { PixelIcon } from "../types";

// Distribute by centres: two bars with lines through their centres in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "align-horizontal-distribute-center",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...o....o",
    "...o...###",
    ".##o##.#o#",
    ".#.o.#.#o#",
    ".#.o.#.#o#",
    ".#.o.#.#o#",
    ".#.o.#.#o#",
    ".##o##.#o#",
    "...o...###",
    "...o....o",
  ],
};

export default icon;
