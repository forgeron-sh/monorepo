import type { PixelIcon } from "../types";

// Arrow pointing down to a ring, the ring in the secondary tone; the arrow of `move-bottom`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-down-to-dot",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    "...######",
    "....####",
    ".....##",
    "",
    "....oo",
    "...o..o",
    "...o..o",
    "....oo",
  ],
};

export default icon;
