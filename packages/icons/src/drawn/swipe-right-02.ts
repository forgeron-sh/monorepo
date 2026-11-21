import type { PixelIcon } from "../types";

// A touch point with an arrow to the right in the secondary tone: swipe right, without the hand of `swipe-right-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "swipe-right-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".###",
    "#...#.....o",
    "#...#.oooooo",
    "#...#.....o",
    ".###",
  ],
};

export default icon;
