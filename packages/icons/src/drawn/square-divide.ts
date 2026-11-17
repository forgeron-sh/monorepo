import type { PixelIcon } from "../types";

// A division sign in the secondary tone in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-divide",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oo...#",
    ".#........#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#........#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
