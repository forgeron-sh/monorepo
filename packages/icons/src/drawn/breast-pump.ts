import type { PixelIcon } from "../types";

// Breast pump: a funnel flange in the secondary tone on a bottle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "breast-pump",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o........o",
    "..o......o",
    "...o....o",
    "....oooo",
    "..########",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...######",
  ],
};

export default icon;
