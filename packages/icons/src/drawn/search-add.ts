import type { PixelIcon } from "../types";

// Zoom in: a nine-pixel lens (odd, so a one-pixel symbol centres exactly), a two-pixel handle, a plus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "search-add",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...###",
    ".##...##",
    ".#.....#",
    "#...o...#",
    "#..ooo..#",
    "#...o...#",
    ".#.....#",
    ".##...##",
    "...###.##",
    "........##",
    ".........##",
  ],
};

export default icon;
