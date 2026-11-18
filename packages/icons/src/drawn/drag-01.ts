import type { PixelIcon } from "../types";

// Drag: a dashed square with the pointer in the secondary tone dragging it from its corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "drag-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##.#.##",
    ".#.....#",
    "",
    ".#.....#",
    "",
    ".#....o",
    ".##.#.oo",
    "......ooo",
    "......oooo",
    "......oo",
    "........o",
  ],
};

export default icon;
