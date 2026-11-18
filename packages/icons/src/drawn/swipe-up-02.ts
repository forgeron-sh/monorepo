import type { PixelIcon } from "../types";

// A touch point with an arrow up in the secondary tone: swipe up; `swipe-right-02` turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "swipe-up-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....o",
    "....ooo",
    ".....o",
    ".....o",
    ".....o",
    ".....o",
    "",
    "....###",
    "...#...#",
    "...#...#",
    "...#...#",
    "....###",
  ],
};

export default icon;
