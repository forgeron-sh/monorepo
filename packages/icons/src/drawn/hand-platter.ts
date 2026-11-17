import type { PixelIcon } from "../types";

// Hand holding a platter: a serving dome over a plate, held by the hand of `hand-heart`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand-platter",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "...oooooo",
    "..o......o",
    "..o......o",
    ".oooooooooo",
    "",
    "#.....##",
    "#.###...#",
    "#....####",
    "#.....#",
    "#",
  ],
};

export default icon;
