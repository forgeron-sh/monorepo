import type { PixelIcon } from "../types";

// A squiggly line: a smooth wave across the grid.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "line-squiggle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    ".##....##",
    "#..#..#..#",
    "....##....##",
  ],
};

export default icon;
