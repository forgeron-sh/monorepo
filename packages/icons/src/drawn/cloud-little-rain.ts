import type { PixelIcon } from "../types";

// Cloud of `rain` with two drops instead of three.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-little-rain",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....###",
    "...##...#",
    "..#......#",
    ".#........#",
    ".#........#",
    "..########",
    "",
    "",
    "....o...o",
    "...o...o",
  ],
};

export default icon;
