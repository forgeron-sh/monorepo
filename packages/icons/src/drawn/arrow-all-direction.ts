import type { PixelIcon } from "../types";

// Move in every direction: a cross with an arrowhead at each end.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-all-direction",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....####",
    ".....##",
    "..#..##..#",
    ".##########",
    ".##########",
    "..#..##..#",
    ".....##",
    "....####",
    ".....##",
  ],
};

export default icon;
