import type { PixelIcon } from "../types";

// Monas, Jakarta: an obelisk crowned with a flame, on a wide cup-shaped platform.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "monas",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....o",
    ".....oo",
    "....oooo",
    "....####",
    "....#..#",
    "....#..#",
    "....#..#",
    ".##########",
    "..#......#",
    "...######",
    "...#....#",
    ".##########",
  ],
};

export default icon;
