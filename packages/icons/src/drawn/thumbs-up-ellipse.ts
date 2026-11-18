import type { PixelIcon } from "../types";

// Thumb up inside a circle, the thumb in the secondary tone. Built on `add-circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "thumbs-up-ellipse",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#....o...#",
    ".#...oo...#",
    ".#.o.oooo.#",
    ".#.o.oooo.#",
    ".#.o.ooo..#",
    ".#.o.ooo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
