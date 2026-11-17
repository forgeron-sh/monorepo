import type { PixelIcon } from "../types";

// Globe with a refresh badge: a circular arrow in the secondary tone at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "global-refresh",
  implemented: true,
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
    "..#.#...oo.o",
    "..###..o..oo",
    "....##.o..oo",
    ".......o",
    "........ooo",
  ],
};

export default icon;
