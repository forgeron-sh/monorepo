import type { PixelIcon } from "../types";

// Report card: a card with a grade A in the secondary tone over a line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "school-report-card",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#..oooo..#",
    ".#..o..o..#",
    ".#........#",
    ".#..####..#",
    ".#........#",
    "..########",
  ],
};

export default icon;
