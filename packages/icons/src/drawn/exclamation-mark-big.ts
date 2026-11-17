import type { PixelIcon } from "../types";

// A wide, bold exclamation mark.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "exclamation-mark-big",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....####",
    "....####",
    "....####",
    ".....##",
    ".....##",
    ".....##",
    "",
    ".....##",
    ".....##",
  ],
};

export default icon;
