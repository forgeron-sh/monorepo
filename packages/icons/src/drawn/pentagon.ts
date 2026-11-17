import type { PixelIcon } from "../types";

// Pentagon with a point on top: 1:1 upper sides, steeper lower sides, a flat base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pentagon",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".#........#",
    "..#......#",
    "..#......#",
    "...#....#",
    "...######",
  ],
};

export default icon;
