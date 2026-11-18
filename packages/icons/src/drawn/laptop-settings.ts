import type { PixelIcon } from "../types";

// Laptop with a cog badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "laptop-settings",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#",
    "..#.....o.o",
    "..####.ooooo",
    ".#####.oo.oo",
    ".......ooooo",
    "........o.o",
  ],
};

export default icon;
