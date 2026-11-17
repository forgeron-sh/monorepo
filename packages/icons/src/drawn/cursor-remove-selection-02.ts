import type { PixelIcon } from "../types";

// Pointer of `cursor-01` with a cross badge in the upper right: clear the selection.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-remove-selection-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".......o...o",
    "..#.....o.o",
    "..##.....o",
    "..###...o.o",
    "..####.o...o",
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
