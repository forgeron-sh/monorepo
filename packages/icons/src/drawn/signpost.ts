import type { PixelIcon } from "../types";

// A signpost: a pole with a sign pointing right above one pointing left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "signpost",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....#",
    ".########",
    ".#.......#",
    ".########",
    ".....#",
    "..#########",
    ".#........#",
    "..#########",
    ".....#",
    ".....#",
    ".....#",
    "...#####",
  ],
};

export default icon;
