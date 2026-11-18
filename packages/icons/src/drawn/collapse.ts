import type { PixelIcon } from "../types";

// Two chevrons pointing at a line in the secondary tone: content folding toward it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "collapse",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
    "",
    ".oooooooooo",
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
  ],
};

export default icon;
