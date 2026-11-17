import type { PixelIcon } from "../types";

// Arrow pointing up to a bar at the top, the bar in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "move-top",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oooooooooo",
    "",
    ".....##",
    "....####",
    "...######",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
