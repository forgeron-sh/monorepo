import type { PixelIcon } from "../types";

// Rotate anticlockwise about a point: the arrow of `rotate-left-01` around a pivot in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rotate-left-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    "###.......#",
    ".#...oo...#",
    ".....oo...#",
    "..........#",
    "..........#",
    ".........#",
    "......###",
  ],
};

export default icon;
