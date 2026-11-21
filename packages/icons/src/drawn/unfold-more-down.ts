import type { PixelIcon } from "../types";

// Up and down triangles, the down one filled in the secondary tone: sort descending.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "unfold-more-down",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..########",
    "",
    "",
    "..oooooooo",
    "...oooooo",
    "....oooo",
    ".....oo",
  ],
};

export default icon;
