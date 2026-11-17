import type { PixelIcon } from "../types";

// Fist: the solid hand of `hand` with its fingers curled, four knuckles and the thumb folded across.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand-fist",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..#.#.#.#",
    "..#.#.#.#",
    ".#########",
    ".#....####",
    ".#########",
    "..########",
    "...#####",
    "...#####",
    "...#####",
  ],
};

export default icon;
