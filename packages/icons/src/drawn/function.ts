import type { PixelIcon } from "../types";

// Function: an f with a hooked top and foot, beside an x in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "function",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....###",
    "...#",
    "...#",
    ".#####",
    "...#..o...o",
    "...#...o.o",
    "...#....o",
    "...#...o.o",
    "...#..o...o",
    "###",
  ],
};

export default icon;
