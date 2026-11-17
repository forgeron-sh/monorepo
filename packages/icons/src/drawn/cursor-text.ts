import type { PixelIcon } from "../types";

// Text cursor: an I-beam with short serifs top and bottom.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-text",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##.##",
    ".....#",
    ".....#",
    ".....#",
    ".....#",
    ".....#",
    ".....#",
    ".....#",
    ".....#",
    "...##.##",
  ],
};

export default icon;
