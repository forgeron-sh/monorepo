import type { PixelIcon } from "../types";

// Arrow pointing down to a bar at the bottom, the bar in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "move-bottom",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    "...######",
    "....####",
    ".....##",
    "",
    ".oooooooooo",
  ],
};

export default icon;
