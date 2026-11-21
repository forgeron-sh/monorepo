import type { PixelIcon } from "../types";

// Phone, cut at the lower right for code brackets in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mobile-programming-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".######",
    ".#....#",
    ".#....#",
    ".#....#",
    ".#",
    ".#",
    ".#.....o.o",
    ".#....o...o",
    ".#.....o.o",
    ".####",
  ],
};

export default icon;
