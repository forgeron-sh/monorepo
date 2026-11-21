import type { PixelIcon } from "../types";

// Pound sign in the box of `square`, the sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pound-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...ooo..#",
    ".#..oo....#",
    ".#.oooo...#",
    ".#..oo....#",
    ".#.oo.....#",
    ".#.oooooo.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
