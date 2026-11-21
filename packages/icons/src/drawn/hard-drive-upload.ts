import type { PixelIcon } from "../types";

// Hard drive with an upward arrow in the secondary tone above it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hard-drive-upload",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....o",
    "....ooo",
    "...o.o.o",
    ".....o",
    ".....o",
    "",
    "..########",
    ".#........#",
    ".##########",
    ".#.##.....#",
    "..########",
  ],
};

export default icon;
