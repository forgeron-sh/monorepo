import type { PixelIcon } from "../types";

// A dashed ellipse: an elliptic selection outline.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ellipse-selection",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...##..##",
    ".##......##",
    "#..........#",
    "",
    "",
    "#..........#",
    ".##......##",
    "...##..##",
  ],
};

export default icon;
