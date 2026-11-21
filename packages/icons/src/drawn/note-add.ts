import type { PixelIcon } from "../types";

// Note with a plus badge: an 8x8 sheet with two lines, cut back around the badge corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "note-add",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    ".#......#",
    ".#.####.#",
    ".#......#",
    ".#.##",
    ".#......o",
    ".#......o",
    ".####.ooooo",
    "........o",
    "........o",
  ],
};

export default icon;
