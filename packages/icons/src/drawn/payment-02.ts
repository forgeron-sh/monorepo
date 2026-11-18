import type { PixelIcon } from "../types";

// A card held above an open hand.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "payment-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..oooooooo",
    "..o......o",
    "..oooooooo",
    "..o......o",
    "..oooooooo",
    "",
    "#.....##",
    "#.###...#",
    "#....####",
    "#.....#",
    "#",
  ],
};

export default icon;
