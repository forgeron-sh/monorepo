import type { PixelIcon } from "../types";

// Cloud struck through: the outline of `cloud` and a 45° slash in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-off",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o",
    "..o..###",
    "...o#...#",
    "..##o....#",
    ".#...o....#",
    "#.....o....#",
    "#......o...#",
    "#.......o..#",
    ".########o#",
    "..........o",
    "...........o",
  ],
};

export default icon;
