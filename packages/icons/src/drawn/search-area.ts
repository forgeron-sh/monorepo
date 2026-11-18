import type { PixelIcon } from "../types";

// Search an area: the corners and dashed edges of a frame, a magnifier in the secondary tone at its lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "search-area",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##.##.##",
    ".#........#",
    ".#........#",
    ".....ooo",
    ".#..o...o",
    ".#..o...o",
    "....o...o",
    ".#...ooo.o",
    ".#.......oo",
    "..##......o",
  ],
};

export default icon;
