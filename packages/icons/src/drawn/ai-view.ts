import type { PixelIcon } from "../types";

// AI view: the outline of `eye` with a sparkle for a pupil in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-view",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "...#####",
    ".##.....##",
    "#....o....#",
    "#...ooo...#",
    "#....o....#",
    ".##.....##",
    "...#####",
  ],
};

export default icon;
