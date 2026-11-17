import type { PixelIcon } from "../types";

// Bevel line join: the outline of a thick L whose outer corner is cut at 45°, the cut in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "join-bevel",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...#",
    ".#...#",
    ".#...#",
    ".#...######",
    ".#........#",
    "..o.......#",
    "...o......#",
    "....o.....#",
    ".....######",
  ],
};

export default icon;
