import type { PixelIcon } from "../types";

// Cleaning brush: a handle on a wide block, the bristles below it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "brush-cleaning",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".##########",
    ".#........#",
    ".##########",
    "..o.o..o.o",
    "..o.o..o.o",
    "..o.o..o.o",
  ],
};

export default icon;
