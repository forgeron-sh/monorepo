import type { PixelIcon } from "../types";

// The round lock of `circle-lock-01` with a minus badge in the lower right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-lock-minus-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    "..#....#",
    "..#....#",
    "..######",
    ".#......#",
    ".#..oo..#",
    ".#..oo..#",
    ".#",
    "..#....ooooo",
    "...###",
  ],
};

export default icon;
