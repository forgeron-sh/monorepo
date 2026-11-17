import type { PixelIcon } from "../types";

// Layout: a window split into a wide main column and a narrow right column cut in two.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layout-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#.....#..#",
    ".#.....#..#",
    ".#.....#..#",
    ".#.....####",
    ".#.....#..#",
    ".#.....#..#",
    ".#.....#..#",
    ".#.....#..#",
    ".##########",
  ],
};

export default icon;
