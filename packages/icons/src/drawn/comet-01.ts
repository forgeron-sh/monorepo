import type { PixelIcon } from "../types";

// A comet: a solid head at the lower left and three streaks of tail.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "comet-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......o..o",
    "......o..o",
    ".....o..o",
    "....o..o..o",
    "......o..o",
    ".....o..o",
    "..##o..o",
    ".####",
    ".####",
    "..##",
  ],
};

export default icon;
