import type { PixelIcon } from "../types";

// A hand trolley carrying two stacked boxes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "trolley-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "##",
    ".#",
    ".#.ooooooo",
    ".#.o.....o",
    ".#.ooooooo",
    ".#.o.....o",
    ".#.ooooooo",
    ".##########",
    "",
    "..##....##",
    "..##....##",
  ],
};

export default icon;
