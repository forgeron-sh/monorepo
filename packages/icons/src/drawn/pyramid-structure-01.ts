import type { PixelIcon } from "../types";

// Pyramid chart: three solid tiers stacked, the middle one in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pyramid-structure-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    "....####",
    "",
    "...oooooo",
    "...oooooo",
    "..oooooooo",
    "",
    ".##########",
    ".##########",
  ],
};

export default icon;
