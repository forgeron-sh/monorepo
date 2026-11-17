import type { PixelIcon } from "../types";

// Thumbs up: a narrow cuff on the left, a hand whose thumb rises from a diagonal shoulder,
// the folded fingers marked by a notch on the right edge (without it the thumb sat on a box).
// Redrawn after Hugeicons `thumbs-up` (Iconify preview, 2026-11-17): composition only.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "thumbs-up",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    "...#...#",
    ".###....###",
    ".#.#......#",
    ".#.#...###",
    ".#.#......#",
    ".#.#.....#",
    ".########",
  ],
};

export default icon;
