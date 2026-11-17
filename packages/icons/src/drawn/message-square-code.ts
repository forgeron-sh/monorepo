import type { PixelIcon } from "../types";

// Square speech bubble with code brackets inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-square-code",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..o..o..#",
    ".#.o....o.#",
    ".#..o..o..#",
    ".#........#",
    "..#..#####",
    "..#.#",
    "..##",
  ],
};

export default icon;
