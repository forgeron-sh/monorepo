import type { PixelIcon } from "../types";

// Window split into a top panel and a left panel.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "panels-top-left",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".##########",
    ".#..#.....#",
    ".#..#.....#",
    ".#..#.....#",
    ".#..#.....#",
    ".#..#.....#",
    ".#..#.....#",
    ".##########",
  ],
};

export default icon;
