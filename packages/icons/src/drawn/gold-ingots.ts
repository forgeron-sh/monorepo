import type { PixelIcon } from "../types";

// Gold ingots: three bars stacked, one on two.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gold-ingots",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "....####",
    "...#....#",
    "...######",
    "",
    ".####..####",
    "#....##....#",
    "############",
  ],
};

export default icon;
