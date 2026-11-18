import type { PixelIcon } from "../types";

// Handset of `call` with a two-way arrow above it in the secondary tone: an internal call.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "call-internal-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##...o..o",
    ".####.oooooo",
    ".####..o..o",
    ".###",
    ".###",
    "..###",
    "...###..##",
    "....#######",
    ".....######",
    "......####",
  ],
};

export default icon;
