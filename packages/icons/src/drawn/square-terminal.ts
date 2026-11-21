import type { PixelIcon } from "../types";

// Square with a terminal prompt: a chevron in the secondary tone and an underscore.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-terminal",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.o......#",
    ".#..o.....#",
    ".#...o....#",
    ".#..o.....#",
    ".#.o..###.#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
