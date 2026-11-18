import type { PixelIcon } from "../types";

// Brochure: a tri-fold leaflet, three panels and two folds, the middle panel's picture in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "brochure",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#..#..#..#",
    ".#..#oo#..#",
    ".#..#oo#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
  ],
};

export default icon;
