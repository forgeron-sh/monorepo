import type { PixelIcon } from "../types";

// Pause bars in the secondary tone in the frame of `square`, the bars of `pause-circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-pause",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#........#",
    "..########",
  ],
};

export default icon;
