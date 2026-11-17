import type { PixelIcon } from "../types";

// TV repair: the television of `tv-01` with a wrench badge in the secondary tone, lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tv-fix",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#....#",
    "....#..#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#",
    ".#####..o.o",
    "..#.....ooo",
    "........oo",
    ".......oo",
    ".......o",
  ],
};

export default icon;
