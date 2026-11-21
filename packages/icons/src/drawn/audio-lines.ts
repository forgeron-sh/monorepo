import type { PixelIcon } from "../types";

// Audio level: four vertical lines of different heights.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "audio-lines",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#",
    "....#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    "....#..#",
    "....#",
  ],
};

export default icon;
