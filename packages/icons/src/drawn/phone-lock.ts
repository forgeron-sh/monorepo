import type { PixelIcon } from "../types";

// Smartphone with a padlock badge in the shared lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "phone-lock",
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
    ".#.....ooo",
    ".#.....o.o",
    ".#.##.ooooo",
    ".#....oo.oo",
    ".####.ooooo",
  ],
};

export default icon;
