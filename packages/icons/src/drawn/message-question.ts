import type { PixelIcon } from "../types";

// Speech bubble of `message-01` with the question-mark badge of `user-question-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-question",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#",
    ".#.....ooo",
    "..#..#....o",
    "..#.#...oo",
    "..##",
    "........o",
  ],
};

export default icon;
