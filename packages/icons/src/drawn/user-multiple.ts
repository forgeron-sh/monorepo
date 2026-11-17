import type { PixelIcon } from "../types";

// Two people side by side, each a round head over square shoulders, two-pixel gap.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-multiple",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..##....##",
    ".#..#..#..#",
    ".#..#..#..#",
    "..##....##",
    "",
    ".###....###",
    "#...#..#...#",
    "#...#..#...#",
    "#####..#####",
  ],
};

export default icon;
