import type { PixelIcon } from "../types";

// Vertical scroll position: a scroll track with its thumb in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "vertical-scroll-point",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    "....#oo#",
    "....#oo#",
    "....#oo#",
    "....#..#",
    "....#..#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
