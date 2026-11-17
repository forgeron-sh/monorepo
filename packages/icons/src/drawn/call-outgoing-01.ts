import type { PixelIcon } from "../types";

// Handset of `call` with a small 45° arrow going out, pointing up and right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "call-outgoing-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....ooo",
    ".####....oo",
    ".####...o.o",
    ".###...o",
    ".###",
    "..###",
    "...###..##",
    "....#######",
    ".....######",
    "......####",
  ],
};

export default icon;
