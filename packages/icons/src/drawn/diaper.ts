import type { PixelIcon } from "../types";

// Diaper seen from the front: a wide waist with the elastic band in the secondary tone, narrowing to the crotch.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "diaper",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "############",
    "#oooooooooo#",
    "#..........#",
    ".#........#",
    "..##....##",
    "....#..#",
    "....####",
  ],
};

export default icon;
