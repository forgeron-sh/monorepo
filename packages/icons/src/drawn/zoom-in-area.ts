import type { PixelIcon } from "../types";

// Zoom into an area: four corner brackets and the plus of `add-square` in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zoom-in-area",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#........#",
    ".#...oo...#",
    ".....oo",
    "...oooooo",
    "...oooooo",
    ".....oo",
    ".#...oo...#",
    ".#........#",
    ".###....###",
  ],
};

export default icon;
