import type { PixelIcon } from "../types";

// Ellipse: a wide oval outline that uses the full width of the grid.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ellipse",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    ".##......##",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    ".##......##",
    "...######",
  ],
};

export default icon;
