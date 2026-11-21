import type { PixelIcon } from "../types";

// Pilcrow with an arrow pointing right underneath, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pilcrow-right",
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
    ".........o",
    ".oooooooooo",
    ".........o",
  ],
};

export default icon;
