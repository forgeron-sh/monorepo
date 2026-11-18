import type { PixelIcon } from "../types";

// Berlin TV tower: a needle, a ball and a shaft on a wide base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "berlin-tower",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    ".....##",
    "....####",
    "...#....#",
    "..#......#",
    "..#......#",
    "...#....#",
    "....####",
    ".....##",
    ".....##",
    ".....##",
    "...######",
  ],
};

export default icon;
