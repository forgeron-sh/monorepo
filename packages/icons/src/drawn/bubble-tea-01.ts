import type { PixelIcon } from "../types";

// Bubble tea: the lidded cup of `cup-soda` with a straight straw, the pearls at the bottom in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bubble-tea-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......#",
    "......#",
    "...######",
    ".##########",
    "..#......#",
    "..#......#",
    "...#....#",
    "...#....#",
    "...#oooo#",
    "...#oooo#",
    "...######",
  ],
};

export default icon;
