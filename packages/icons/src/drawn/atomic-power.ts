import type { PixelIcon } from "../types";

// Radiation trefoil: three blades around a centre dot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "atomic-power",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".####..####",
    "####....####",
    "####.##.####",
    ".....##",
    "",
    ".....##",
    "....####",
    "...######",
    "....####",
  ],
};

export default icon;
