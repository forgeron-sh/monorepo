import type { PixelIcon } from "../types";

// The Envato mark: a quick scribble that zigzags down and ends in a dot.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "envato",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........###",
    "......###",
    "....###",
    "..#######",
    "......##",
    "....###",
    "..#######",
    "......##",
    "....###",
    "...##",
    "",
    "...#",
  ],
};

export default icon;
