import type { PixelIcon } from "../types";

// Drum: two crossed sticks in the secondary tone over the drumhead, the shell with two lugs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "drum",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...o....o",
    "....o..o",
    ".....oo",
    "....o..o",
    "...o....o",
    "..########",
    ".#........#",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
  ],
};

export default icon;
