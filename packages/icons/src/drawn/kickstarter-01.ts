import type { PixelIcon } from "../types";

// The Kickstarter K in pixels: a rounded upright bar with two rounded arms.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "kickstarter-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....##",
    ".####..####",
    ".####.####",
    ".########",
    ".#######",
    ".#######",
    ".########",
    ".####.####",
    ".####..####",
    "..##....##",
  ],
};

export default icon;
