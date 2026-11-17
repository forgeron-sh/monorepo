import type { PixelIcon } from "../types";

// Diagonal double arrow, lower left to upper right, in the ring of `circle-arrow-down-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-diagonal-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#....ooo.#",
    ".#.....oo.#",
    ".#....o.o.#",
    ".#.o.o....#",
    ".#.oo.....#",
    ".#.ooo....#",
    "..#......#",
    "...######",
  ],
};

export default icon;
