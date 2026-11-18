import type { PixelIcon } from "../types";

// Power drill: a body with a chuck, a pistol grip below, the bit in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "drill",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#######",
    ".#.....###",
    ".#.....###oo",
    ".#.....###",
    ".#######",
    "...#..#",
    "...#..#",
    "...#..#",
    "...####",
  ],
};

export default icon;
