import type { PixelIcon } from "../types";

// The Meta mark in pixels: the looped infinity sign.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "meta",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".###....###",
    "#...#..#...#",
    "#....##....#",
    "#....##....#",
    "#...#..#...#",
    ".###....###",
  ],
};

export default icon;
