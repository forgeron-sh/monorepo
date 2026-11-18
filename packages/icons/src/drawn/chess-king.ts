import type { PixelIcon } from "../types";

// Chess king: a cross on top of a tall body with a flared base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chess-king",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....####",
    ".....##",
    "..########",
    "..#......#",
    "...#....#",
    "....#..#",
    "....#..#",
    "...#....#",
    "..#......#",
    ".##########",
  ],
};

export default icon;
