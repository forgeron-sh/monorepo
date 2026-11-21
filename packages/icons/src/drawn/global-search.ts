import type { PixelIcon } from "../types";

// Globe with a search badge: a small magnifier in the secondary tone at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "global-search",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..###..###",
    "..#.#..#.#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
    ".#..#..#",
    "..#.#...oo",
    "..###..o..o",
    "....##.o..o",
    "........ooo",
    "...........o",
  ],
};

export default icon;
