import type { PixelIcon } from "../types";

// Padlock with two circling arrows in the secondary tone (lock being synced).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lock-sync-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    ".##########",
    ".#........#",
    ".#",
    ".#.....ooo",
    ".#....o...o",
    ".#....oo..o",
    ".####.o..oo",
    ".......ooo",
  ],
};

export default icon;
