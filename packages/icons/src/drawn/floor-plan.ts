import type { PixelIcon } from "../types";

// Floor plan: an outer wall with inner walls and two door gaps.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "floor-plan",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#....#...#",
    ".#....#...#",
    ".#........#",
    ".#........#",
    ".##..######",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
