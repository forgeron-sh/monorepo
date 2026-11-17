import type { PixelIcon } from "../types";

// Bar chart decreasing: an axis with three horizontal bars getting shorter, the bars in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-bar-decreasing",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#",
    ".#.ooooooo",
    ".#",
    ".#.ooooo",
    ".#",
    ".#.ooo",
    ".#",
    ".#",
    ".##########",
  ],
};

export default icon;
