import type { PixelIcon } from "../types";

// Campfire: a flame in the secondary tone over two crossed logs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "campfire",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....o",
    ".....oo",
    "....o..o",
    "...o....o",
    "...o....o",
    "...o....o",
    "....oooo",
    ".##......##",
    "...##..##",
    ".....##",
    "...##..##",
  ],
};

export default icon;
