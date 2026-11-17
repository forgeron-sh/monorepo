import type { PixelIcon } from "../types";

// A power symbol in the ring of `circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-power",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#...oo...#",
    "#....oo....#",
    "#..o.oo.o..#",
    "#..o.oo.o..#",
    "#..o....o..#",
    ".#..o..o..#",
    ".#...oo...#",
    "..##....##",
    "....####",
  ],
};

export default icon;
