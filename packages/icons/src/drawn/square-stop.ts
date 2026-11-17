import type { PixelIcon } from "../types";

// A stop square in the secondary tone in the frame of `square`, the square of `stop-circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-stop",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
