import type { PixelIcon } from "../types";

// Car of `car-01`, one column left and one row up, with a P badge in the lower right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "car-parking-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..######",
    ".#......#",
    "##########",
    "#oo....oo#",
    "#........#",
    "######",
    "##.....oooo",
    "##.....o...o",
    ".......oooo",
    ".......o",
    ".......o",
  ],
};

export default icon;
