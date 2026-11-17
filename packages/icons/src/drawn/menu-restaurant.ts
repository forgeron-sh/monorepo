import type { PixelIcon } from "../types";

// Fork and knife side by side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "menu-restaurant",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#..#...##",
    ".#..#..###",
    ".#..#..###",
    ".####..###",
    "..##...###",
    "..##....##",
    "..##....##",
    "..##....##",
    "..##....##",
    "..##....##",
  ],
};

export default icon;
