import type { PixelIcon } from "../types";

// Archive remove: the archive box with a cross in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "archive-x",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".##########",
    "..#......#",
    "..#.o..o.#",
    "..#..oo..#",
    "..#..oo..#",
    "..#.o..o.#",
    "..#......#",
    "..########",
  ],
};

export default icon;
