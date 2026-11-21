import type { PixelIcon } from "../types";

// Ring with a plus at the top left and a minus at the bottom right in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "minus-plus-circle-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#..o.....#",
    "#..ooo.....#",
    "#...o......#",
    "#..........#",
    "#.....ooo..#",
    ".#........#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
