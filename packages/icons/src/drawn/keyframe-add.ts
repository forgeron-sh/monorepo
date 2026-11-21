import type { PixelIcon } from "../types";

// Keyframe with a plus: a diamond, a plus badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "keyframe-add",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...##",
    "..#..#",
    ".#....#",
    "#......#",
    "#......#",
    ".#....#",
    "..#..#..o",
    "...##...o",
    "......ooooo",
    "........o",
    "........o",
  ],
};

export default icon;
