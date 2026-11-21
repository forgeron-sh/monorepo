import type { PixelIcon } from "../types";

// The HTML5 mark: a shield with the figure 5 cut out of it.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "html-5",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    ".##########",
    ".##......##",
    ".##.#######",
    ".##.....###",
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
