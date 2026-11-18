import type { PixelIcon } from "../types";

// Cloud of `cloud-cog` with the clock badge of `calendar-clock`: a scheduled backup.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-backup",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....###",
    "....#...#",
    "..###....#",
    ".#",
    "#.......ooo",
    "#......o.o.o",
    "#......o.ooo",
    ".####..o...o",
    "........ooo",
  ],
};

export default icon;
