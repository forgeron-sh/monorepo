import type { PixelIcon } from "../types";

// Round line join: the outline of a thick L whose outer corner is rounded, the curve in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "join-round",
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
    "..o.......#",
    "...oo.....#",
    ".....######",
  ],
};

export default icon;
