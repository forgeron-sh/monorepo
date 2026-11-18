import type { PixelIcon } from "../types";

// Several keyframes with a plus badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "keyframes-multiple-add",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..##..#..#",
    ".#..#..#..#",
    "#....#..#..#",
    "#....#..#..#",
    ".#..#..#..#",
    "..##..#..#",
    "",
    "........o",
    "........o",
    "......ooooo",
    "........o",
    "........o",
  ],
};

export default icon;
