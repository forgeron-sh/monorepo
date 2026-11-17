import type { PixelIcon } from "../types";

// Camera automatic: the camera of camera-add-01 with a letter A in the secondary tone in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "camera-automatically-01",
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
    "#..oooo.ooo",
    "#......o...o",
    "######.ooooo",
    ".......o...o",
    ".......o...o",
  ],
};

export default icon;
