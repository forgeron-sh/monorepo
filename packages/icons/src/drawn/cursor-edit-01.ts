import type { PixelIcon } from "../types";

// Pointer of `cursor-01` with a pencil badge in the upper right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-edit-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..........oo",
    "..#......o.o",
    "..##....o.o",
    "..###...oo",
    "..####",
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
