import type { PixelIcon } from "../types";

// Send: a paper plane pointing right, with its notch on the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "send-horizontal",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "##",
    "#.##",
    ".#..##",
    ".#....##",
    "..#.....####",
    "..#.....####",
    ".#....##",
    ".#..##",
    "#.##",
    "##",
  ],
};

export default icon;
