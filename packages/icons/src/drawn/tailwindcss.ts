import type { PixelIcon } from "../types";

// The Tailwind CSS mark in pixels: the two waves, one above and to the right of the other.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "tailwindcss",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....###",
    "....#####..#",
    ".......#####",
    "........###",
    ".###",
    "#####..#",
    "...#####",
    "....###",
  ],
};

export default icon;
