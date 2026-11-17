import type { PixelIcon } from "../types";

// Chef's toque: a puffed crown over a banded base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chef",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".###....###",
    "#..........#",
    "#..........#",
    ".#........#",
    "..#......#",
    "..#......#",
    "..########",
    "..#......#",
    "..########",
  ],
};

export default icon;
