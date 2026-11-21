import type { PixelIcon } from "../types";

// Reverse withdrawal: the banknote of money-add-01 under a U-turn arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "reverse-withdrawal-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....o",
    "...oooooo",
    "....o....o",
    ".........o",
    "",
    ".##########",
    ".#...##...#",
    ".#..#..#..#",
    ".#...##...#",
    ".##########",
  ],
};

export default icon;
