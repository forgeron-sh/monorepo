import type { PixelIcon } from "../types";

// Rotate clockwise: three quarters of the `clock-01` ring, left side, top and right, ending in the downward head of `refresh`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rotate-right-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#.......###",
    ".#........#",
    ".#",
    ".#",
    ".#",
    "..#",
    "...###",
  ],
};

export default icon;
