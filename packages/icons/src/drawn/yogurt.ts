import type { PixelIcon } from "../types";

// Yogurt: a tapered pot with a spoon and a label band in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "yogurt",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........#",
    "........#",
    ".......#",
    ".##########",
    ".#........#",
    "..#......#",
    "..#oooooo#",
    "..#......#",
    "..#......#",
    "...######",
  ],
};

export default icon;
