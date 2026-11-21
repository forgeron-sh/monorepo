import type { PixelIcon } from "../types";

// Carrot: a solid tapering root pointing down-left, its leaves in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "carrot",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......o..o",
    "........o.o",
    ".........oo",
    "......###",
    ".....####",
    "....####",
    "...####",
    "...###",
    "..###",
    "..##",
    "..#",
  ],
};

export default icon;
