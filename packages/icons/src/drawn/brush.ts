import type { PixelIcon } from "../types";

// Paint brush standing upright: a two-pixel handle, a ferrule, a wide head of bristles in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "brush",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    "....####",
    "....####",
    "...oooooo",
    "...oooooo",
    "....oooo",
    ".....oo",
  ],
};

export default icon;
