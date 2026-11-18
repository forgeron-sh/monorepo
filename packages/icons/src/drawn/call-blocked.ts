import type { PixelIcon } from "../types";

// Blocked call: the handset of `call` and a no-entry badge in the secondary tone in the free
// upper right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "call-blocked",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##...ooo",
    ".####.o..oo",
    ".####.o.o.o",
    ".###..oo..o",
    ".###...ooo",
    "..###",
    "...###..##",
    "....#######",
    ".....######",
    "......####",
  ],
};

export default icon;
