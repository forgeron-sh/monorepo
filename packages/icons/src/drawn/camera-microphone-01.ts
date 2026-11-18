import type { PixelIcon } from "../types";

// Camera of `camera-01` with a microphone badge in the lower right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "camera-microphone-01",
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
    "#..oooo.ooo",
    "#.......ooo",
    "######.o...o",
    "........ooo",
    ".........o",
  ],
};

export default icon;
