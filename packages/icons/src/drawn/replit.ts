import type { PixelIcon } from "../types";

// The Replit mark in pixels: three blocks stepping out to the right and back.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "replit",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".#####",
    ".#####",
    ".#####",
    ".#####",
    "......#####",
    "......#####",
    "......#####",
    "......#####",
    ".#####",
    ".#####",
    ".#####",
    ".#####",
  ],
};

export default icon;
