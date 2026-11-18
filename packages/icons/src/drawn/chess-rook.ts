import type { PixelIcon } from "../types";

// Chess rook: three merlons on a tower with a flared base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chess-rook",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##.##.##",
    "..########",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "..#......#",
    ".##########",
  ],
};

export default icon;
