import type { PixelIcon } from "../types";

// The LeetCode logo mark in pixels: the open bracket that curls round, and the bar in its mouth.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "leetcode",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......#",
    ".....##",
    "....##",
    "...##..#",
    "..##....#",
    ".##",
    ".#...######",
    ".##",
    "..##....#",
    "...##..##",
    "....####",
  ],
};

export default icon;
