import type { PixelIcon } from "../types";

// Tornado: five stacked strokes shrinking and wandering down to a tip.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tornado-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "",
    "..########",
    "",
    "....######",
    "",
    ".....####",
    "",
    "....###",
    "",
    ".....##",
  ],
};

export default icon;
