import type { PixelIcon } from "../types";

// Double-headed horizontal arrow in the ring of `circle-arrow-down-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-horizontal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#..o..o..#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#..o..o..#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
