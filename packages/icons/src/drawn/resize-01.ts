import type { PixelIcon } from "../types";

// Resize: a small square at the lower left and a diagonal arrow in the secondary tone pulling its corner out.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "resize-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......oooo",
    ".........oo",
    "........o.o",
    ".......o..o",
    "......o",
    ".#####",
    ".#...#",
    ".#...#",
    ".#...#",
    ".#####",
  ],
};

export default icon;
