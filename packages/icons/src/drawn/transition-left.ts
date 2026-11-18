import type { PixelIcon } from "../types";

// A tray with an arrow leaving to the left: transition to the left. `transition-top`, turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "transition-left",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#####",
    "......#...#",
    "...o..#...#",
    "..oo......#",
    ".ooooooo..#",
    ".ooooooo..#",
    "..oo......#",
    "...o..#...#",
    "......#...#",
    "......#####",
  ],
};

export default icon;
