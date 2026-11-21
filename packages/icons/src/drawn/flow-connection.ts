import type { PixelIcon } from "../types";

// Two boxes joined by an elbow connector in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flow-connection",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####",
    ".#..#oooo",
    ".#..#...o",
    ".####...o",
    "........o",
    "........o",
    ".......####",
    ".......#..#",
    ".......#..#",
    ".......####",
  ],
};

export default icon;
