import type { PixelIcon } from "../types";

// A right chevron in the frame of `square`: `square-chevron-down` turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-chevron-right",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..oo....#",
    ".#...oo...#",
    ".#....oo..#",
    ".#....oo..#",
    ".#...oo...#",
    ".#..oo....#",
    ".#........#",
    "..########",
  ],
};

export default icon;
