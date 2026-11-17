import type { PixelIcon } from "../types";

// Search focus: the lens of `search-add` with a solid dot at its centre in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "search-focus",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...###",
    ".##...##",
    ".#.....#",
    "#..ooo..#",
    "#..ooo..#",
    "#..ooo..#",
    ".#.....#",
    ".##...##",
    "...###.##",
    "........##",
    ".........##",
  ],
};

export default icon;
