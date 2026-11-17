import type { PixelIcon } from "../types";

// Speech bubble with two lines of text in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "comment-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#........#",
    ".#.oooo...#",
    ".#........#",
    "..#..#####",
    "..#.#",
    "..##",
  ],
};

export default icon;
