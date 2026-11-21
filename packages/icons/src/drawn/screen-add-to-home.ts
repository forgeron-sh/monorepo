import type { PixelIcon } from "../types";

// Add to home screen: a phone, an arrow in the secondary tone entering it through a gap in its side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "screen-add-to-home",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....####",
    "....#....#",
    "....#....#",
    "...ooo...#",
    "....oo...#",
    "...o.o...#",
    "..o......#",
    ".o.......#",
    "....#....#",
    ".....####",
  ],
};

export default icon;
