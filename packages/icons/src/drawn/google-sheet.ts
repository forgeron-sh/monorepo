import type { PixelIcon } from "../types";

// The Google Sheets mark: a page with a cut corner and a table of four cells cut out of it.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "google-sheet",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".######",
    ".#######",
    ".########",
    ".#########",
    ".##########",
    ".##..#...##",
    ".##..#...##",
    ".##########",
    ".##..#...##",
    ".##..#...##",
    ".##########",
    ".##########",
  ],
};

export default icon;
