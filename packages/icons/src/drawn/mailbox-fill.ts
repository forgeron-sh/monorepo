import type { PixelIcon } from "../types";

// Filled `mailbox`: the outline filled in, the inner symbol cut out (2026-11-17). Generated from the
// outline drawing (fill what the outer contour encloses, keep what the inner symbol encloses
// empty, an area filled in the tone of its contour), then checked in the review sheet.
const icon: PixelIcon = {
  name: "mailbox-fill",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........oo",
    "..######.oo",
    ".########o",
    ".#######.o",
    ".########o",
    ".########",
    "....##",
    "....##",
    "....##",
    "..######",
  ],
};

export default icon;
