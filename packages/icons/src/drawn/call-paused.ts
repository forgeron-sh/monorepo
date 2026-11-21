import type { PixelIcon } from "../types";

// Call: the handset of call, a pause sign in the secondary tone in the upper-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "call-paused",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##...o.o",
    ".####..o.o",
    ".####..o.o",
    ".###...o.o",
    ".###",
    "..###",
    "...###..##",
    "....#######",
    ".....######",
    "......####",
  ],
};

export default icon;
