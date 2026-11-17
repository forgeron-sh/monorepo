import type { PixelIcon } from "../types";

// Car of `car-01` with a clock badge in the lower right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "car-time",
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
    "#######",
    "##......ooo",
    "##.....o.o.o",
    ".......o.ooo",
    ".......o...o",
    "........ooo",
  ],
};

export default icon;
