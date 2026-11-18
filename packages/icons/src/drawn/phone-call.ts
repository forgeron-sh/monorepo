import type { PixelIcon } from "../types";

// Handset of `call` with two sound waves in the secondary tone at the upper right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "phone-call",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##..ooo",
    ".####....o",
    ".####.oo..o",
    ".###....o.o",
    ".###....o.o",
    "..###",
    "...###..##",
    "....#######",
    ".....######",
    "......####",
  ],
};

export default icon;
