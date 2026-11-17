import type { PixelIcon } from "../types";

// Search off: the lens of `search-add` crossed inside by a short slash in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "search-slash",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...###",
    ".##...##",
    ".#....o#",
    "#....o..#",
    "#...o...#",
    "#..o....#",
    ".#o....#",
    ".##...##",
    "...###.##",
    "........##",
    ".........##",
  ],
};

export default icon;
