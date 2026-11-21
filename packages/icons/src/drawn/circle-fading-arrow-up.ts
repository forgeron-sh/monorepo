import type { PixelIcon } from "../types";

// An up arrow in a ring whose left half fades into dashes, the dashes of `circle-dashed`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-fading-arrow-up",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..#.....##",
    ".#........#",
    ".....oo...#",
    "#...oooo...#",
    "#..oooooo..#",
    "#....oo....#",
    "#....oo....#",
    ".....oo...#",
    ".#........#",
    "..#.....##",
    "....####",
  ],
};

export default icon;
