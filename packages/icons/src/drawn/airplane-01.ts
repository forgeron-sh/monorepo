import type { PixelIcon } from "../types";

// Aeroplane seen from above, solid, two-pixel fuselage.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "airplane-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    ".....##",
    "...######",
    ".##########",
    ".##..##..##",
    ".....##",
    ".....##",
    "....####",
    "...######",
  ],
};

export default icon;
