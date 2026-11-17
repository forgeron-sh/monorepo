import type { PixelIcon } from "../types";

// One sparkle: a four-pointed star with concave sides.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sparkle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    "....####",
    "...######",
    ".##########",
    ".##########",
    "...######",
    "....####",
    ".....##",
    ".....##",
  ],
};

export default icon;
