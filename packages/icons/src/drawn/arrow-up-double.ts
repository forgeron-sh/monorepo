import type { PixelIcon } from "../types";

// Double chevron pointing up: `arrow-down-double` flipped.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-up-double",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....##",
    "....####",
    "...##..##",
    "...#....#",
    ".....##",
    "....####",
    "...##..##",
    "...#....#",
  ],
};

export default icon;
