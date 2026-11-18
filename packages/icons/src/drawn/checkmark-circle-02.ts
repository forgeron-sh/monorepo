import type { PixelIcon } from "../types";

// Check mark in the full-grid ring of `circle`, in two-pixel runs like `tick-01`, in the secondary
// tone: the heavier counterpart of `checkmark-circle-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "checkmark-circle-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    "#.......oo.#",
    "#......oo..#",
    "#.oo..oo...#",
    "#..oooo....#",
    ".#..oo....#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
