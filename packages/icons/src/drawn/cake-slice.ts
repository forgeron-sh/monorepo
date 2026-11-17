import type { PixelIcon } from "../types";

// Cake slice: a wedge seen from above and the side, a filling layer in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cake-slice",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "........###",
    "......##..#",
    "....##....#",
    "..##......#",
    ".##########",
    ".#........#",
    ".#oooooooo#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
