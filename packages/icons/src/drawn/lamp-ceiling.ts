import type { PixelIcon } from "../types";

// Pendant lamp hanging from the ceiling, its bulb under the shade.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lamp-ceiling",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....#",
    ".....#",
    ".....#",
    "....###",
    "...#...#",
    "..#.....#",
    ".#.......#",
    "###########",
    "...o...o",
    "....ooo",
  ],
};

export default icon;
