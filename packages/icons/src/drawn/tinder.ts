import type { PixelIcon } from "../types";

// The Tinder mark in pixels: the flame with the small lick on its left side.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "tinder",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......#",
    "......##",
    "......###",
    "...#..####",
    "...#######",
    "..########",
    "..#########",
    ".##########",
    ".##########",
    ".##########",
    "..########",
    "...######",
  ],
};

export default icon;
