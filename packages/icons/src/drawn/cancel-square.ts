import type { PixelIcon } from "../types";

// Cross in the secondary tone inside the box of `checkmark-square-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cancel-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.o....o.#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#.o....o.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
