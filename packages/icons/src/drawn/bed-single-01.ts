import type { PixelIcon } from "../types";

// A single bed with one pillow.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bed-single-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..oooo..#",
    ".#........#",
    ".##########",
    "#..........#",
    "############",
    "#..........#",
  ],
};

export default icon;
