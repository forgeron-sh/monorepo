import type { PixelIcon } from "../types";

// Round face with closed eyes and puckered lips in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "kissing",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    "#..##..##..#",
    "#..........#",
    "#..........#",
    "#.....oo...#",
    ".#.....o..#",
    ".#....oo..#",
    "..##....##",
    "....####",
  ],
};

export default icon;
