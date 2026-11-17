import type { PixelIcon } from "../types";

// A sigma in the secondary tone in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-sigma",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.oooooo.#",
    ".#..o.....#",
    ".#...o....#",
    ".#...o....#",
    ".#..o.....#",
    ".#.oooooo.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
