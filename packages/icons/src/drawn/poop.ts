import type { PixelIcon } from "../types";

// Poop: a three-tier swirl ending in a curled tip, one-pixel outline.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "poop",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......##",
    "....###",
    "...#....#",
    "..########",
    ".#........#",
    ".#........#",
    "############",
    "#..........#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
