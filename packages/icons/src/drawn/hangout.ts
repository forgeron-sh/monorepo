import type { PixelIcon } from "../types";

// The Google Hangouts mark: a round speech bubble with two quotation marks cut out of it and a tail
// at the lower right.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hangout",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    "..########",
    ".##########",
    ".##..##..##",
    ".##..##..##",
    ".###.###.##",
    ".##########",
    ".##########",
    "..########",
    "...#######",
    "......##",
    "......#",
  ],
};

export default icon;
