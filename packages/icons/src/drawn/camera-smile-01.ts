import type { PixelIcon } from "../types";

// Camera of `camera-01` with a smiley badge in the lower right corner, for face detection.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "camera-smile-01",
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
    "#..o..o..#",
    "#..oooo",
    "#.......o.o",
    "######",
    ".......o...o",
    "........ooo",
  ],
};

export default icon;
