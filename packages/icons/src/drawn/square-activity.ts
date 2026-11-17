import type { PixelIcon } from "../types";

// A pulse line in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-activity",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...o....#",
    ".#...o....#",
    ".#...o....#",
    ".#ooo.o.oo#",
    ".#.....o..#",
    ".#.....o..#",
    ".#........#",
    "..########",
  ],
};

export default icon;
