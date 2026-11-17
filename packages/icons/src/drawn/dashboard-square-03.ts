import type { PixelIcon } from "../types";

// Dashboard: a wide panel on top in the secondary tone over two squares.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dashboard-square-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oooooooooo",
    ".o........o",
    ".o........o",
    ".oooooooooo",
    "",
    "",
    ".####..####",
    ".#..#..#..#",
    ".#..#..#..#",
    ".####..####",
  ],
};

export default icon;
