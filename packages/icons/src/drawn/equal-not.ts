import type { PixelIcon } from "../types";

// Not equal: the bars of `equal-sign` crossed by a steep slash in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "equal-not",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........o",
    "........o",
    ".......o",
    ".......o",
    "..#####o##",
    "......o",
    "......o",
    "..###o####",
    ".....o",
    ".....o",
    "....o",
    "....o",
  ],
};

export default icon;
