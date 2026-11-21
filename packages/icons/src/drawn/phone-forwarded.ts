import type { PixelIcon } from "../types";

// Handset of `call-add` with a right arrow in the secondary tone: the call is forwarded.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "phone-forwarded",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....o",
    ".####....o",
    ".####.ooooo",
    ".###.....o",
    ".###....o",
    "..###",
    "...###..##",
    "....#######",
    ".....######",
    "......####",
  ],
};

export default icon;
