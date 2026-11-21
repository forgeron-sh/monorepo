import type { PixelIcon } from "../types";

// Road sign: a diamond with a turn-right arrow inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "directions-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "...#....#",
    "..#...o..#",
    ".#..ooooo.#",
    "#...o..o...#",
    "#...o.o....#",
    ".#..o.....#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
