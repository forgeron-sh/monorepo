import type { PixelIcon } from "../types";

// Square panel with dashed lines in the secondary tone on both sides.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "panel-left-right-dashed",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#........#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#........#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".##########",
  ],
};

export default icon;
