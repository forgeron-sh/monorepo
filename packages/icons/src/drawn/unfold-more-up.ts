import type { PixelIcon } from "../types";

// Up and down triangles, the up one filled in the secondary tone: sort ascending.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "unfold-more-up",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "....oooo",
    "...oooooo",
    "..oooooooo",
    "",
    "",
    "..########",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
