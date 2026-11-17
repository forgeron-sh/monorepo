import type { PixelIcon } from "../types";

// Desktop computer with a padlock on its screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lock-computer",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
