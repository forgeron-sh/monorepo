import type { PixelIcon } from "../types";

// Jigsaw puzzle piece: a square with a knob on top and one on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "puzzle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##",
    "...#..#",
    ".###..###",
    ".#......#",
    ".#......##",
    ".#........#",
    ".#........#",
    ".#......##",
    ".#......#",
    ".########",
  ],
};

export default icon;
