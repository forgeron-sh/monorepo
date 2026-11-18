import type { PixelIcon } from "../types";

// The CSS3 mark: a shield with the figure 3 cut out of it.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "css-3",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    ".##########",
    ".##......##",
    ".#######.##",
    ".###.....##",
    ".#######.##",
    ".##......##",
    ".##########",
    ".##########",
    "..########",
    "...######",
    "....####",
  ],
};

export default icon;
