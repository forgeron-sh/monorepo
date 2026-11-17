import type { PixelIcon } from "../types";

// A round dot in the secondary tone in the frame of `square`, the dot of `circle-dot`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-dot",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#...oo...#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
