import type { PixelIcon } from "../types";

// Page layout with a header, a left sidebar beside the content, and a footer.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layout-04",
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
    ".##########",
    ".#........#",
    ".##########",
  ],
};

export default icon;
