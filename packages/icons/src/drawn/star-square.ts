import type { PixelIcon } from "../types";

// A solid star in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "star-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#...oo...#",
    ".#.oooooo.#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#.oo..oo.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
