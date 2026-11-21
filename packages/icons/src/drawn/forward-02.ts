import type { PixelIcon } from "../types";

// A forward arrow: a shaft curving up from the lower left into an arrowhead pointing right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "forward-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "........#",
    "........##",
    "...########",
    "..#.....##",
    ".#......#",
    ".#",
    ".#",
    ".#",
  ],
};

export default icon;
