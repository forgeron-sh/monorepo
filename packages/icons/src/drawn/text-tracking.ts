import type { PixelIcon } from "../types";

// Tracking: the letters A and V set apart, over a double arrow, in the secondary tone, spanning the line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-tracking",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#....#...#",
    ".#.#...#...#",
    ".#.#....#.#",
    "#####...#.#",
    "#...#....#",
    "",
    "",
    ".o........o",
    "oooooooooooo",
    ".o........o",
  ],
};

export default icon;
