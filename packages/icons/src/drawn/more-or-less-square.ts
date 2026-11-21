import type { PixelIcon } from "../types";

// Square with a plus above a minus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "more-or-less-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..########",
    ".#........#",
    ".#...oo...#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#...oo...#",
    ".#........#",
    ".#........#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
