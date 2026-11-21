import type { PixelIcon } from "../types";

// Floor lamp: a shade on a tall pole with a small foot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lamp-floor",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....###",
    "...#...#",
    "..#.....#",
    ".#########",
    ".....#",
    ".....#",
    ".....#",
    ".....#",
    ".....#",
    "...#####",
  ],
};

export default icon;
