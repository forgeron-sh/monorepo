import type { PixelIcon } from "../types";

// Thin arrow pointing right: `arrow-down-03` turned a quarter.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-right-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#",
    ".......#",
    "........#",
    ".........#",
    ".##########",
    ".........#",
    "........#",
    ".......#",
    "......#",
  ],
};

export default icon;
