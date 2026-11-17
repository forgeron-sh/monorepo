import type { PixelIcon } from "../types";

// Exploded pie chart: a pie with its upper right quarter pulled out, the slice in the secondary
// tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pie-chart-04",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......ooo",
    "......o..o",
    "..###.o...o",
    ".#..#.o...o",
    "#...#.ooooo",
    "#...#",
    "#...#####",
    "#.......#",
    "#.......#",
    ".#.....#",
    "..#####",
  ],
};

export default icon;
