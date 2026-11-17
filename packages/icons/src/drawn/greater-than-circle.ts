import type { PixelIcon } from "../types";

// Greater-than sign in the secondary tone inside a circle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "greater-than-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#.oo.....#",
    "#....oo....#",
    "#......oo..#",
    "#......oo..#",
    "#....oo....#",
    ".#.oo.....#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
