import type { PixelIcon } from "../types";

// RSS feed unlocked: the arcs of `rss` drawn smaller, with an open padlock badge in the secondary tone in the lower right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rss-unlocked",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###",
    "....##",
    "......#",
    ".##....#",
    "...#....#",
    "....#",
    ".....#..ooo",
    ".oo..#..o",
    ".oo..#.ooooo",
    ".......ooooo",
    ".......ooooo",
  ],
};

export default icon;
