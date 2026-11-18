import type { PixelIcon } from "../types";

// Sock: a cuff, a leg, a heel and a foot pointing left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "socks",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#####",
    "....#...#",
    "....#####",
    "....#...#",
    "....#...#",
    "....#...#",
    "..##....#",
    ".#......#",
    ".#.....#",
    "..#####",
  ],
};

export default icon;
