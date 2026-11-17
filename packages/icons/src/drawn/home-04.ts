import type { PixelIcon } from "../types";

// A house with eaves: the roof wider than the walls, and the door in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "home-04",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    ".##########",
    "..#......#",
    "..#......#",
    "..#..oo..#",
    "..#..oo..#",
    "..#..oo..#",
    "..########",
  ],
};

export default icon;
