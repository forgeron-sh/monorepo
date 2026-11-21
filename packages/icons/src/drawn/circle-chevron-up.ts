import type { PixelIcon } from "../types";

// A chevron pointing up in the ring of `circle-arrow-down-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-chevron-up",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#.oo..oo.#",
    ".#.o....o.#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
