import type { PixelIcon } from "../types";

// Yen sign in a rounded square: the frame of `dollar-square`, the sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "yen-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.oo..oo.#",
    ".#..oooo..#",
    ".#.oooooo.#",
    ".#...oo...#",
    ".#.oooooo.#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
