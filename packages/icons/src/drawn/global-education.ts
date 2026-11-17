import type { PixelIcon } from "../types";

// Globe with a graduation cap badge at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "global-education",
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
    "..#.#",
    "..###....o",
    "....##.ooooo",
    "........o.o",
    "........ooo",
  ],
};

export default icon;
