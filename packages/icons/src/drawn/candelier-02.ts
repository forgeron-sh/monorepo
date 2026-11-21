import type { PixelIcon } from "../types";

// Chandelier: a chain, a wide bowl under five candles, their flames in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "candelier-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    ".....##",
    "",
    ".o.o.oo.o.o",
    ".#.#.##.#.#",
    ".#.#.##.#.#",
    "############",
    ".#........#",
    "..#......#",
    "...######",
    ".....##",
  ],
};

export default icon;
