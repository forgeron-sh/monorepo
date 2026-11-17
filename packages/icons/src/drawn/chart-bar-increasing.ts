import type { PixelIcon } from "../types";

// Bar chart increasing: an axis with three horizontal bars getting longer, the bars in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-bar-increasing",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#",
    ".#.ooo",
    ".#",
    ".#.ooooo",
    ".#",
    ".#.ooooooo",
    ".#",
    ".#",
    ".##########",
  ],
};

export default icon;
