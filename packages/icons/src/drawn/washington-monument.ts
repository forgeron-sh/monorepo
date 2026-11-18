import type { PixelIcon } from "../types";

// Washington Monument: an obelisk with a pointed cap on a stepped base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "washington-monument",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....####",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    "...######",
    "..########",
  ],
};

export default icon;
