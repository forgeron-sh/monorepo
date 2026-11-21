import type { PixelIcon } from "../types";

// Rotate clockwise about a point: `rotate-left-02` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rotate-right-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#.......###",
    ".#...oo...#",
    ".#...oo",
    ".#",
    ".#",
    "..#",
    "...###",
  ],
};

export default icon;
