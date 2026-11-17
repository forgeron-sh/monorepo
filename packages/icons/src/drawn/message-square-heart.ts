import type { PixelIcon } from "../types";

// Square speech bubble with a heart inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-square-heart",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#.oo..oo.#",
    ".#.oooooo.#",
    ".#..oooo..#",
    ".#...oo...#",
    ".#........#",
    "..#..#####",
    "..#.#",
    "..##",
  ],
};

export default icon;
