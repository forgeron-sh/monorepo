import type { PixelIcon } from "../types";

// Phone, cut at the lower right for a shield in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mobile-protection",
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
    ".#....ooooo",
    ".#....o...o",
    ".#....o...o",
    ".#.....o.o",
    ".####...o",
  ],
};

export default icon;
