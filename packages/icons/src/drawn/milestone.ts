import type { PixelIcon } from "../types";

// Milestone: a signpost board pointing right on a pole, on a base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "milestone",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    ".#######",
    ".#......#",
    ".#.......#",
    ".#......#",
    ".#######",
    ".....#",
    ".....#",
    ".....#",
    "...#####",
  ],
};

export default icon;
