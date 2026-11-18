import type { PixelIcon } from "../types";

// Account recovery: a person with a circular arrow badge in the secondary tone, lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "account-recovery",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##",
    "...#..#",
    "...#..#",
    "....##",
    "",
    "..####",
    ".#.....o.oo",
    ".#.....oo..o",
    ".#.....ooo.o",
    ".#####.....o",
    "........ooo",
  ],
};

export default icon;
