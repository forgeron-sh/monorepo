import type { PixelIcon } from "../types";

// Wind: three gusts, the outer two ending in curls.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fast-wind",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......##",
    "........#",
    ".#######",
    "",
    "",
    "...########",
    "",
    ".########",
    ".........#",
    ".......##",
  ],
};

export default icon;
