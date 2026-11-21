import type { PixelIcon } from "../types";

// A cross in the secondary tone above a banknote, like `money-remove-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "banknote-x",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....o..o",
    ".....oo",
    ".....oo",
    "....o..o",
    "",
    ".##########",
    ".#...##...#",
    ".#..#..#..#",
    ".#...##...#",
    ".##########",
  ],
};

export default icon;
