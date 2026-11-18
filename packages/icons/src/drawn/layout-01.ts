import type { PixelIcon } from "../types";

// Layout: a frame with a header in the secondary tone and a sidebar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layout-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#oooooooo#",
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
