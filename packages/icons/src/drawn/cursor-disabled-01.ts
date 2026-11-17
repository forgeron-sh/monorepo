import type { PixelIcon } from "../types";

// Pointer of `cursor-01` with a no-entry badge: a ring and its slash.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-disabled-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........ooo",
    "..#....o..oo",
    "..##...o.o.o",
    "..###..oo..o",
    "..####..ooo",
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
