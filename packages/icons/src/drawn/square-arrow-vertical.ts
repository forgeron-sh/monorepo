import type { PixelIcon } from "../types";

// A two-headed vertical arrow in the frame of `square`, `square-arrow-horizontal` turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-vertical",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...o....#",
    ".#..ooo...#",
    ".#...o....#",
    ".#...o....#",
    ".#..ooo...#",
    ".#...o....#",
    ".#........#",
    "..########",
  ],
};

export default icon;
