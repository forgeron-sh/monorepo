import type { PixelIcon } from "../types";

// Thumb down inside a circle, the thumb in the secondary tone. Built on `add-circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "thumbs-down-ellipse",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..ooo.o.#",
    ".#..ooo.o.#",
    ".#.oooo.o.#",
    ".#.oooo.o.#",
    ".#...oo...#",
    ".#...o....#",
    "..#......#",
    "...######",
  ],
};

export default icon;
