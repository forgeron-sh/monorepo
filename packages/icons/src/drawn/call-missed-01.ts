import type { PixelIcon } from "../types";

// Handset of `call` with a small cross in the secondary tone at the upper right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "call-missed-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##...o..o",
    ".####...oo",
    ".####...oo",
    ".###...o..o",
    ".###",
    "..###",
    "...###..##",
    "....#######",
    ".....######",
    "......####",
  ],
};

export default icon;
