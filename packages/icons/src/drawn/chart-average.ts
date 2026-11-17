import type { PixelIcon } from "../types";

// Chart average: bars on an axis with the average line across them in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-average",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#....##",
    ".#....##",
    ".#",
    ".#oooooooooo",
    ".#",
    ".#.##.##.##",
    ".#.##.##.##",
    ".#.##.##.##",
    ".##########",
  ],
};

export default icon;
