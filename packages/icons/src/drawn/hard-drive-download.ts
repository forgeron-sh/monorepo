import type { PixelIcon } from "../types";

// Hard drive with a downward arrow in the secondary tone above it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hard-drive-download",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....o",
    ".....o",
    "...o.o.o",
    "....ooo",
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
