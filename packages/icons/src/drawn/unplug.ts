import type { PixelIcon } from "../types";

// A plug pulled away from the wall.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "unplug",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..oooooooo",
    "",
    "",
    "....#..#",
    "....#..#",
    "..########",
    "..#......#",
    "..#......#",
    "...#....#",
    "....####",
    ".....##",
  ],
};

export default icon;
