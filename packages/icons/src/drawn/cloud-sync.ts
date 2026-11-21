import type { PixelIcon } from "../types";

// Cloud of `cloud-cog` with the sync loop of `file-sync`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-sync",
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
    "#......ooo",
    "#.....o...o",
    "#.....oo..o",
    ".####.o..oo",
    ".......ooo",
  ],
};

export default icon;
