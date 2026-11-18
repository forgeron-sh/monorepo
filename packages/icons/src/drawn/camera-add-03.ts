import type { PixelIcon } from "../types";

// Camera of `camera-03`, one column left, with a plus badge in the lower right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "camera-add-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    "##########",
    "#........#",
    "#..oooo..#",
    "#..oooo..#",
    "#..oooo",
    "#..oooo..o",
    "#........o",
    "######.ooooo",
    ".........o",
    ".........o",
  ],
};

export default icon;
