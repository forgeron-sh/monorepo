import type { PixelIcon } from "../types";

// Latin cross: a one-pixel outline, the beam crossing above the middle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "cross",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "....#..#",
    "....#..#",
    ".####..####",
    ".#........#",
    ".#........#",
    ".####..####",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    "....####",
  ],
};

export default icon;
