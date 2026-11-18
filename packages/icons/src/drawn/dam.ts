import type { PixelIcon } from "../types";

// Dam seen from the side: a tapered concrete wall holding water lines in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dam",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....###",
    "....#..#",
    "oooo#..#",
    "....#...#",
    "oooo#...#",
    "....#....#",
    "oooo#....#",
    "....#.....#",
    "############",
  ],
};

export default icon;
