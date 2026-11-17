import type { PixelIcon } from "../types";

// A hex nut: the hexagon of `hexagon-01` with the threaded hole in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "nut",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    ".#........#",
    ".#...oo...#",
    "#...o..o...#",
    "#...o..o...#",
    ".#...oo...#",
    ".#........#",
    "..#......#",
    "..########",
  ],
};

export default icon;
