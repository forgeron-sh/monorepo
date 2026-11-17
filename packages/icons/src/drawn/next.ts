import type { PixelIcon } from "../types";

// Skip forward: a solid triangle and a two-pixel bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "next",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#.......##",
    ".###.....##",
    ".#####...##",
    ".#######.##",
    ".#######.##",
    ".#####...##",
    ".###.....##",
    ".#.......##",
  ],
};

export default icon;
