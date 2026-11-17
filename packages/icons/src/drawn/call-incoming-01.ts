import type { PixelIcon } from "../types";

// Handset of `call` with a small 45° arrow coming in, pointing down and left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "call-incoming-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##......o",
    ".####..o.o",
    ".####..oo",
    ".###...ooo",
    ".###",
    "..###",
    "...###..##",
    "....#######",
    ".....######",
    "......####",
  ],
};

export default icon;
