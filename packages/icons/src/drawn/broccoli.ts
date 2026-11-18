import type { PixelIcon } from "../types";

// Broccoli: a broccoli: three bumpy florets on a branching stem.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "broccoli",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##..##",
    ".#..##..##",
    "#.........#",
    "#..........#",
    ".#........#",
    "..###..###",
    "....o..o",
    "....oooo",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
