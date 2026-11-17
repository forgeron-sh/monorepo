import type { PixelIcon } from "../types";

// Note with a minus badge: `note-add` with its plus turned into a minus.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "note-remove",
  implemented: true,
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
    ".#",
    ".#",
    ".####.ooooo",
  ],
};

export default icon;
