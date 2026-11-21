import type { PixelIcon } from "../types";

// A submarine with its tower and periscope.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "submarine",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "......##",
    "......#",
    "....####",
    "....#..#",
    "..########",
    ".#........#",
    "#..........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
