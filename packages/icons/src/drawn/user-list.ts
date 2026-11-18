import type { PixelIcon } from "../types";

// Person beside three list lines in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-list",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##",
    ".#..#..oooo",
    ".#..#",
    "..##",
    "",
    "..##...oooo",
    ".#..#",
    "#....#",
    "#....#..ooo",
    "######",
  ],
};

export default icon;
