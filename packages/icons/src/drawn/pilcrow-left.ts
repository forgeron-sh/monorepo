import type { PixelIcon } from "../types";

// Pilcrow with an arrow pointing left underneath, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pilcrow-left",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#######",
    "..#####..#",
    "..#####..#",
    "...####..#",
    "......#..#",
    "......#..#",
    "......#..#",
    "",
    "..o",
    ".oooooooooo",
    "..o",
  ],
};

export default icon;
