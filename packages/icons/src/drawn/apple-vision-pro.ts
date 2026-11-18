import type { PixelIcon } from "../types";

// A spatial headset seen from the front: the wide curved visor with its notch for the nose.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "apple-vision-pro",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..########",
    ".#........#",
    "#..........#",
    "#..........#",
    "#....##....#",
    ".#..#..#..#",
    "..##....##",
  ],
};

export default icon;
