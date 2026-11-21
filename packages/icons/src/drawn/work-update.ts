import type { PixelIcon } from "../types";

// Work update: the briefcase of `work-history` with the sync badge of `folder-sync`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "work-update",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    ".##########",
    ".#........#",
    ".#",
    ".#.....ooo",
    ".#....o...o",
    ".#....oo..o",
    ".#....o..oo",
    ".####..ooo",
  ],
};

export default icon;
