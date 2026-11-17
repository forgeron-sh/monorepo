import type { PixelIcon } from "../types";

// A plus in a ring whose left half fades into dashes, the dashes of `circle-dashed`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-fading-plus",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..#.....##",
    ".#........#",
    ".....oo...#",
    "#....oo....#",
    "#..oooooo..#",
    "#..oooooo..#",
    "#....oo....#",
    ".....oo...#",
    ".#........#",
    "..#.....##",
    "....####",
  ],
};

export default icon;
