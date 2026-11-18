import type { PixelIcon } from "../types";

// Limit: a gauge open at the bottom, its needle in the secondary tone near the top of the scale.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "limitation",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    "#.......o..#",
    "#......o...#",
    "#....oo....#",
    "#....oo....#",
    ".#........#",
    ".#........#",
    "..##....##",
  ],
};

export default icon;
