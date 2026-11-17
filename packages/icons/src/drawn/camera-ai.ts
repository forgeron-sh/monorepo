import type { PixelIcon } from "../types";

// Camera of `camera-01` with a solid sparkle badge in the lower right corner, for AI.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "camera-ai",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    "##########",
    "#........#",
    "#..oooo..#",
    "#..o..o..#",
    "#..o..o",
    "#..oooo..o",
    "#.......ooo",
    "######.ooooo",
    "........ooo",
    ".........o",
  ],
};

export default icon;
