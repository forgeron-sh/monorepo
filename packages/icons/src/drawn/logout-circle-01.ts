import type { PixelIcon } from "../types";

// Ring open on the right with an arrow leaving it to the right in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "logout-circle-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#",
    ".#.......o",
    "#.........o",
    "#...oooooooo",
    "#.........o",
    "#........o",
    ".#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
