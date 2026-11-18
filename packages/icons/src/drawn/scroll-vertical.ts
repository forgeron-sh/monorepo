import type { PixelIcon } from "../types";

// Vertical scroll: horizonal-scroll-point turned a quarter, arrows up and down around a dot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "scroll-vertical",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....####",
    "...######",
    "",
    "",
    ".....oo",
    ".....oo",
    "",
    "",
    "...######",
    "....####",
    ".....##",
  ],
};

export default icon;
