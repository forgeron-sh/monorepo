import type { PixelIcon } from "../types";

// Phone handset with a minus in the secondary tone in the free upper right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "call-minus",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##",
    ".####",
    ".####.ooooo",
    ".###",
    ".###",
    "..###",
    "...###..##",
    "....#######",
    ".....######",
    "......####",
  ],
};

export default icon;
