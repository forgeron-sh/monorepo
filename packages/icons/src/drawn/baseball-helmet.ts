import type { PixelIcon } from "../types";

// A batting helmet in profile: a dome, an ear guard in the secondary tone, a bill to the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "baseball-helmet",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...#####",
    "..#.....#",
    ".#.......#",
    ".#.......#",
    ".#.ooo...#",
    ".#.o.o...###",
    ".#.ooo.....#",
    ".###########",
  ],
};

export default icon;
