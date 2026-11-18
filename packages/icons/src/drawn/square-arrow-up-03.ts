import type { PixelIcon } from "../types";

// Arrow up leaving the frame of `square`: the arrow of `square-arrow-up-01` breaks through the top side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-up-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....oo",
    "....oooo",
    "...oooooo",
    ".....oo",
    "..##.oo.##",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
