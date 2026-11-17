import type { PixelIcon } from "../types";

// Laptop with an exclamation mark on its screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "laptop-issue",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    "..#..oo...#",
    "..#..oo...#",
    "..#..oo...#",
    "..#.......#",
    "..#..oo...#",
    "..########",
    ".##########",
  ],
};

export default icon;
