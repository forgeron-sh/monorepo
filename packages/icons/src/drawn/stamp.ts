import type { PixelIcon } from "../types";

// A rubber stamp: a knob and neck over the block, with its print below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stamp",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    "....#..#",
    "....#..#",
    ".##########",
    ".#........#",
    ".##########",
    "",
    ".oooooooooo",
  ],
};

export default icon;
