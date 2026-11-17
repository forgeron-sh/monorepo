import type { PixelIcon } from "../types";

// An upward arrow leaving a dot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-up-from-dot",
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
    "..#..##..#",
    ".....##",
    ".....##",
    "",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
