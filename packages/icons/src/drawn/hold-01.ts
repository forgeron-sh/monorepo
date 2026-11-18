import type { PixelIcon } from "../types";

// Hand holding a box in the secondary tone: the hand of `hand-heart`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hold-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...oooooo",
    "...o....o",
    "...o....o",
    "...o....o",
    "...oooooo",
    "",
    "#.....##",
    "#.###...#",
    "#....####",
    "#.....#",
    "#",
  ],
};

export default icon;
