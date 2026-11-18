import type { PixelIcon } from "../types";

// Browser window with a padlock badge in the secondary tone, lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "web-security",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#",
    ".#.....ooo",
    ".#.....o.o",
    ".#....ooooo",
    ".#....ooooo",
    ".####.ooooo",
  ],
};

export default icon;
