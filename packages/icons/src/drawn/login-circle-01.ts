import type { PixelIcon } from "../types";

// Ring open on the left with an arrow entering it from the left in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "login-circle-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#...o....#",
    "......o....#",
    "oooooooo...#",
    "......o....#",
    ".....o.....#",
    ".#........#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
