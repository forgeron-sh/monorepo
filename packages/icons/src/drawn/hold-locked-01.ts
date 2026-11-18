import type { PixelIcon } from "../types";

// Hand holding a padlock in the secondary tone: the hand of `hand-heart`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hold-locked-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "....o..o",
    "...oooooo",
    "...oo..oo",
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
