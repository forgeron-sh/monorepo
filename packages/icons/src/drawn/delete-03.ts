import type { PixelIcon } from "../types";

// Bin of `delete-02` with a cross inside in the secondary tone: delete for good.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "delete-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".##########",
    "",
    ".#........#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#........#",
    "..########",
  ],
};

export default icon;
