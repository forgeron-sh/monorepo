import type { PixelIcon } from "../types";

// Sunglasses: the glasses frame with tinted lenses.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sunglasses",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "#####..#####",
    "#ooo####ooo#",
    "#ooo#..#ooo#",
    "#ooo#..#ooo#",
    ".###....###",
  ],
};

export default icon;
