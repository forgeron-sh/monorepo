import type { PixelIcon } from "../types";

// Horizontal pipe through a valve with its wheel.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "gas-pipe",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...oooooo",
    ".....oo",
    "....####",
    "#####..#####",
    "#..........#",
    "#..........#",
    "#####..#####",
    "....####",
  ],
};

export default icon;
