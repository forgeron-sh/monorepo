import type { PixelIcon } from "../types";

// Circle with a function sign f inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "function-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#....oo..#",
    "#....o.....#",
    "#...oooo...#",
    "#....o.....#",
    "#....o.....#",
    ".#...o....#",
    ".#..o.....#",
    "..##....##",
    "....####",
  ],
};

export default icon;
