import type { PixelIcon } from "../types";

// Camera of `camera-01`, one column left, with a plus badge in the lower right corner cut out with a one-pixel clearance.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "camera-add-01",
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
    "#........o",
    "######.ooooo",
    ".........o",
    ".........o",
  ],
};

export default icon;
