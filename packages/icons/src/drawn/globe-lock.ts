import type { PixelIcon } from "../types";

// Globe with a padlock: `globe` in the primary tone, a padlock in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "globe-lock",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..###..###",
    "..#.#..#.#",
    ".#..#..#..#",
    ".##########",
    ".#####",
    ".#..#...ooo",
    "..#.#...o.o",
    "..###..ooooo",
    "....##.ooooo",
    ".......ooooo",
  ],
};

export default icon;
