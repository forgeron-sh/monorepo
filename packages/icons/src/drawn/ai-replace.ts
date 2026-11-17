import type { PixelIcon } from "../types";

// AI replace: a box, two swap arrows and the AI sparkle badge in place of the second box.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-replace",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####",
    ".#..#.####",
    ".#..#....#",
    ".####...###",
    ".........#",
    "..#",
    ".###.....o",
    "..#.....ooo",
    "..####.ooooo",
    "........ooo",
    ".........o",
  ],
};

export default icon;
