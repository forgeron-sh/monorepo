import type { PixelIcon } from "../types";

// Move: a two-pixel cross with an arrowhead at each end, symmetric both ways.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "move",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....####",
    ".....##",
    "..#..##..#",
    ".##########",
    ".##########",
    "..#..##..#",
    ".....##",
    "....####",
    ".....##",
  ],
};

export default icon;
