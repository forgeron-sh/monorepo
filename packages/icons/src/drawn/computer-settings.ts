import type { PixelIcon } from "../types";

// The monitor of `computer` with the cog badge of `file-cog`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "computer-settings",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#",
    ".#####..o.o",
    ".....#.ooooo",
    ".....#.oo.oo",
    "...###.ooooo",
    "........o.o",
  ],
};

export default icon;
