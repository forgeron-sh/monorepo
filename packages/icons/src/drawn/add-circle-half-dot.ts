import type { PixelIcon } from "../types";

// Add, half done: the add-circle ring, its left half dotted, the plus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "add-circle-half-dot",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##.####",
    ".........#",
    ".#...oo...#",
    ".#...oo...#",
    "...oooooo.#",
    "...oooooo.#",
    ".#...oo...#",
    ".#...oo...#",
    ".........#",
    "...##.####",
  ],
};

export default icon;
