import type { PixelIcon } from "../types";

// Circle with a plus over a minus inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "more-or-less-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#...o....#",
    ".#...o....#",
    "#..ooooo...#",
    "#....o.....#",
    "#....o.....#",
    "#..........#",
    ".#.ooooo..#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
