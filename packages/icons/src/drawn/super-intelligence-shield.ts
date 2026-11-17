import type { PixelIcon } from "../types";

// Shield with the S I badge of super intelligence at the lower right, in the secondary tone; the shield of shield-cog-corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "super-intelligence-shield",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#",
    "..#....ooo.o",
    "...#...o...o",
    "....#..ooo.o",
    ".....#...o.o",
    ".......ooo.o",
  ],
};

export default icon;
