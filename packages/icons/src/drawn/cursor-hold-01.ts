import type { PixelIcon } from "../types";

// Pointer (the cursor-01 base) with a press-and-hold ring in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-hold-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........oo",
    "..#.....o..o",
    "..##....o..o",
    "..###....oo",
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
