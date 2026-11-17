import type { PixelIcon } from "../types";

// Location arrow: a solid arrowhead pointing up and right, symmetric about its diagonal, with
// a notch at the tail (a chevron read as the letter A).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "navigation-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........#",
    ".......###",
    ".....#####",
    "..########",
    "..#######",
    ".....####",
    "......##",
    "......##",
    "......##",
  ],
};

export default icon;
