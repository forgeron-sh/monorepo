import type { PixelIcon } from "../types";

// Square speech bubble of `message-square-x` with a plus over a minus inside, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-square-diff",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#...oo...#",
    ".#..oooo..#",
    ".#...oo...#",
    ".#........#",
    ".#..oooo..#",
    "..#..#####",
    "..#.#",
    "..##",
  ],
};

export default icon;
