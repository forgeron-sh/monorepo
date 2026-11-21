import type { PixelIcon } from "../types";

// A door frame open to the right, an arrow leaving it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the arrow.
const icon: PixelIcon = {
  name: "logout-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#",
    ".#......o",
    ".#.......o",
    ".#..ooooooo",
    ".#.......o",
    ".#......o",
    ".#",
    ".#",
    ".#####",
  ],
};

export default icon;
