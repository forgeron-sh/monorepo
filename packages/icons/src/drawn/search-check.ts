import type { PixelIcon } from "../types";

// Search with a check: the search-remove lens with a check in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "search-check",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...###",
    ".##...##",
    ".#.....#",
    "#.....o.#",
    "#..o.o..#",
    "#...o...#",
    ".#.....#",
    ".##...##",
    "...###.##",
    "........##",
    ".........##",
  ],
};

export default icon;
