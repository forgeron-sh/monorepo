import type { PixelIcon } from "../types";

// Pointer of `cursor-01` with a loading ring badge in the upper right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-loading-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........ooo",
    "..#....o...o",
    "..##...o...o",
    "..###..o",
    "..####..o",
    "..#####",
    "..######",
    "..####",
    "..##.##",
    "..#..##",
    "......##",
    "......##",
  ],
};

export default icon;
