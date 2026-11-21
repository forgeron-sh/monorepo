import type { PixelIcon } from "../types";

// Thumb down inside a rounded square, the thumb in the secondary tone. Built on `search-square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "thumbs-down-rectangle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..ooo.o.#",
    ".#..ooo.o.#",
    ".#.oooo.o.#",
    ".#.oooo.o.#",
    ".#...oo...#",
    ".#...o....#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
