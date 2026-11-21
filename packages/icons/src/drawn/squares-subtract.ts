import type { PixelIcon } from "../types";

// A square with its lower right corner cut by a second square, whose outline is in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "squares-subtract",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#######",
    ".#.....#",
    ".#.....#",
    ".#..####ooo",
    ".#..#.....o",
    ".#..#.....o",
    ".####.....o",
    "....o.....o",
    "....o.....o",
    "....ooooooo",
  ],
};

export default icon;
