import type { PixelIcon } from "../types";

// Car with signal bars badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "car-signal",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...oooooo",
    "..o......o",
    "....oooo",
    "",
    "...######",
    "..#......#",
    ".##########",
    ".#........#",
    ".##########",
    ".##......##",
    ".##......##",
  ],
};

export default icon;
