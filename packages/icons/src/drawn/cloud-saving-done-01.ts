import type { PixelIcon } from "../types";

// Saved to the cloud: `cloud` with a check mark in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-saving-done-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....###",
    "....#...#",
    "..###....#",
    ".#.....o..#",
    "#...o.o....#",
    "#....o.....#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
