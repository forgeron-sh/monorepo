import type { PixelIcon } from "../types";

// Horizontal bars of growing length from the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bar-chart-horizontal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####",
    ".####",
    "",
    ".#######",
    ".#######",
    "",
    ".oooooooooo",
    ".oooooooooo",
  ],
};

export default icon;
