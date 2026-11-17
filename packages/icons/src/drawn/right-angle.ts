import type { PixelIcon } from "../types";

// Right angle: two perpendicular lines and the square mark in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "right-angle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#",
    ".#",
    ".#",
    ".#",
    ".#",
    ".#ooo",
    ".#..o",
    ".#..o",
    ".##########",
  ],
};

export default icon;
