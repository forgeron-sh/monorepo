import type { PixelIcon } from "../types";

// The Pocket mark in pixels: the rounded pocket shape with the chevron cut out of it.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pocket",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "############",
    "############",
    "###.####.###",
    "###..##..###",
    "####....####",
    "#####..#####",
    ".##########",
    ".##########",
    "..########",
    "...######",
    "....####",
  ],
};

export default icon;
