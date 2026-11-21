import type { PixelIcon } from "../types";

// Cloud with an AI sparkle badge at the lower right, in the secondary tone; the cloud cut back one pixel
// around it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-cloud",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....###",
    "....#...#",
    "..###....#",
    ".#........#",
    "#",
    "#...##...o",
    "#.......ooo",
    ".#####.ooooo",
    "........ooo",
    ".........o",
  ],
};

export default icon;
