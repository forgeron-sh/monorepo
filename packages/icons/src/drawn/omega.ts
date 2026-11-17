import type { PixelIcon } from "../types";

// The Greek capital letter omega.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "omega",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...#....#",
    "...#....#",
    ".###....###",
  ],
};

export default icon;
