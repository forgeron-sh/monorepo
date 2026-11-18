import type { PixelIcon } from "../types";

// Call: the handset of call, a lock in the secondary tone in the upper-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "call-locked",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##...ooo",
    ".####..o.o",
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
