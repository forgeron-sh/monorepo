import type { PixelIcon } from "../types";

// Keyframe on a horizontal guide: a diamond, the guide in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "keyframe-align-horizontal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "oo#......#oo",
    "oo#......#oo",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
