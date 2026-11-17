import type { PixelIcon } from "../types";

// Takeaway coffee: a lid, a tapered cup and its sleeve in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "coffee-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..########",
    "...#....#",
    "...#....#",
    "...#oooo#",
    "...#oooo#",
    "....#..#",
    "....#..#",
    "....#..#",
    "....####",
  ],
};

export default icon;
