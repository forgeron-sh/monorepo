import type { PixelIcon } from "../types";

// Small bird perched, solid silhouette facing right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bird",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "......###",
    ".....#####",
    ".....####",
    "##..#####",
    ".#######",
    "..######",
    "...####",
    ".....#",
    "....##",
  ],
};

export default icon;
