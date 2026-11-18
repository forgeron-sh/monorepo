import type { PixelIcon } from "../types";

// Car alert: the car of car-time with an exclamation mark in the secondary tone in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "car-alert",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..######",
    ".#......#",
    "##########",
    "#oo....oo#",
    "#........#",
    "#######",
    "##.......o",
    "##.......o",
    ".........o",
    "",
    ".........o",
  ],
};

export default icon;
