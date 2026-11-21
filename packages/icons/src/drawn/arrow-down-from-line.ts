import type { PixelIcon } from "../types";

// Arrow pointing down away from a bar at the top, the bar in the secondary tone; the arrow of `move-bottom`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-down-from-line",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".oooooooooo",
    "",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    "...######",
    "....####",
    ".....##",
  ],
};

export default icon;
