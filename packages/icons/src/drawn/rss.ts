import type { PixelIcon } from "../types";

// RSS feed: a dot in the secondary tone and two quarter arcs, steps 4, 2, 1, 1, 2, 4.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rss",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####",
    ".....##",
    ".......#",
    "........#",
    ".##......#",
    "...#.....#",
    "....#.....#",
    ".....#....#",
    ".oo...#...#",
    ".oo...#...#",
  ],
};

export default icon;
