import type { PixelIcon } from "../types";

// A necktie: a small knot over a long pointed blade.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tie",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".....##",
    "....#..#",
    "....#..#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
