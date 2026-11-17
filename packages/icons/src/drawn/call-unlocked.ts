import type { PixelIcon } from "../types";

// Call: the handset of call, an open lock in the secondary tone in the upper-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "call-unlocked",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##...ooo",
    ".####..o",
    ".####.ooooo",
    ".###..ooooo",
    ".###..ooooo",
    "..###",
    "...###..##",
    "....#######",
    ".....######",
    "......####",
  ],
};

export default icon;
