import type { PixelIcon } from "../types";

// One person with a chain-link badge: someone linked to you.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "affiliate",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##",
    "...#..#",
    "...#..#",
    "....##",
    "",
    "..###",
    ".#......ooo",
    ".#......o.o",
    ".#....ooooo",
    ".####.o.o",
    "......ooo",
  ],
};

export default icon;
