import type { PixelIcon } from "../types";

// Beer crossed out: the mug of `beer` and a diagonal in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "beer-off",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o.##.##",
    ".#o.#####",
    ".#.o....#",
    ".#..o...###",
    ".#...o..#.#",
    ".#....o.#.#",
    ".#.....o..#",
    ".#......o.#",
    ".#......#o",
    ".########.o",
    "...........o",
  ],
};

export default icon;
