import type { PixelIcon } from "../types";

// A vertical arrow with a head at each end.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-vertical",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....####",
    "...######",
    "..##.##.##",
    ".....##",
    ".....##",
    "..##.##.##",
    "...######",
    "....####",
    ".....##",
  ],
};

export default icon;
