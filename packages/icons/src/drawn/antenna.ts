import type { PixelIcon } from "../types";

// Antenna: a mast with a head, two waves each side in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "antenna",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o........o",
    "o..o....o..o",
    "o.o..##..o.o",
    "o.o..##..o.o",
    "o..o....o..o",
    ".o...##...o",
    ".....##",
    ".....##",
    ".....##",
    "....####",
  ],
};

export default icon;
