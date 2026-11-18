import type { PixelIcon } from "../types";

// Rotate 360°: a flat orbit drawn as an ellipse, ending in an arrowhead at the front.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rotate-360",
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
    ".##....#..#",
    "...######",
    ".......#",
  ],
};

export default icon;
