import type { PixelIcon } from "../types";

// Two people side by side, each wearing a mortarboard in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "students",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oooo..oooo",
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
