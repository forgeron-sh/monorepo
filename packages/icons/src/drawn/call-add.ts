import type { PixelIcon } from "../types";

// Phone handset with a plus in the secondary tone in the free upper right corner, as the badge of `call-blocked`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "call-add",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....o",
    ".####...o",
    ".####.ooooo",
    ".###....o",
    ".###....o",
    "..###",
    "...###..##",
    "....#######",
    ".....######",
    "......####",
  ],
};

export default icon;
