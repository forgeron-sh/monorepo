import type { PixelIcon } from "../types";

// Arrow down leaving the frame of `square`: `square-arrow-up-03` flipped.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-down-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#...oo...#",
    ".#...oo...#",
    "..##.oo.##",
    ".....oo",
    "...oooooo",
    "....oooo",
    ".....oo",
  ],
};

export default icon;
