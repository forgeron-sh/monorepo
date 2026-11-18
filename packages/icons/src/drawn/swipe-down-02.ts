import type { PixelIcon } from "../types";

// A touch point with an arrow down in the secondary tone: `swipe-up-02` turned upside down.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-down-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....###",
    "...#...#",
    "...#...#",
    "...#...#",
    "....###",
    "",
    ".....o",
    ".....o",
    ".....o",
    ".....o",
    "....ooo",
    ".....o",
  ],
};

export default icon;
