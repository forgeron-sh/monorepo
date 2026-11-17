import type { PixelIcon } from "../types";

// Focus: four viewfinder corners around a solid dot in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "focus",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".###....###",
    ".#........#",
    ".#........#",
    "",
    ".....oo",
    "....oooo",
    "....oooo",
    ".....oo",
    "",
    ".#........#",
    ".#........#",
    ".###....###",
  ],
};

export default icon;
