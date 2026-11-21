import type { PixelIcon } from "../types";

// Three flat stones stacked in a cairn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stone",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "....####",
    "..######",
    ".#......#",
    "..######",
    ".##########",
    "#..........#",
    ".##########",
  ],
};

export default icon;
