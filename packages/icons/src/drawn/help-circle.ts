import type { PixelIcon } from "../types";

// Ring with a two-pixel “?”: a top bar and a hook stepping down to the stem (a left hook crowded
// the ring).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the question mark.
const icon: PixelIcon = {
  name: "help-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..oooo..#",
    ".#.....oo.#",
    ".#....oo..#",
    ".#...oo...#",
    ".#........#",
    ".#...oo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
