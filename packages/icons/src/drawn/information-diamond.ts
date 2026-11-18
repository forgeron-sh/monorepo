import type { PixelIcon } from "../types";

// Letter i in the diamond of `alert-diamond`, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "information-diamond",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "...#....#",
    "..#..oo..#",
    ".#........#",
    "#....oo....#",
    "#....oo....#",
    ".#...oo...#",
    "..#..oo..#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
