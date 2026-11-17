import type { PixelIcon } from "../types";

// Full battery: a body and its tip, the charge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "battery-full",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#########",
    ".#.......#",
    ".#.ooooo.##",
    ".#.ooooo.##",
    ".#.......#",
    ".#########",
  ],
};

export default icon;
