import type { PixelIcon } from "../types";

// Parentheses inside a circle: the round brackets in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "1st-bracket-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#..o..o..#",
    "#..o....o..#",
    "#..o....o..#",
    "#..o....o..#",
    "#..o....o..#",
    ".#..o..o..#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
