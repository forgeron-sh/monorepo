import type { PixelIcon } from "../types";

// Scroll: a sheet with a rolled edge at the top left and the bottom right, two lines of text.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "scroll-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#########",
    "#.#......#",
    ".##......#",
    "..#......#",
    "..#.oooo.#",
    "..#......#",
    "..#.oooo.#",
    "..#......##",
    "..#......#.#",
    "..#########",
  ],
};

export default icon;
