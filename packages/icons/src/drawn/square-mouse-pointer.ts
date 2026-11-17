import type { PixelIcon } from "../types";

// A mouse pointer in the secondary tone over the lower right corner of `square`, the frame cut around it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-mouse-pointer",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#....o",
    ".#....oo",
    ".#....ooo",
    ".#....oooo",
    "..##..oo",
    "........oo",
  ],
};

export default icon;
