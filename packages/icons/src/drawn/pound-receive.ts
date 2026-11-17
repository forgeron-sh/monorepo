import type { PixelIcon } from "../types";

// Pound received: `pound-send` with its arrow turned to point in, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pound-receive",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    "..##",
    "..##",
    "..##",
    "######",
    "..##",
    "..##.....o",
    "..##....o",
    ".##....ooooo",
    "######..o",
    ".........o",
  ],
};

export default icon;
