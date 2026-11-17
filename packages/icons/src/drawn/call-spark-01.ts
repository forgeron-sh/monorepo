import type { PixelIcon } from "../types";

// Call: the handset of call, a spark in the secondary tone in the upper-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "call-spark-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....o",
    ".####..ooo",
    ".####.ooooo",
    ".###...ooo",
    ".###....o",
    "..###",
    "...###..##",
    "....#######",
    ".....######",
    "......####",
  ],
};

export default icon;
