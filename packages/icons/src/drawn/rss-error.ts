import type { PixelIcon } from "../types";

// RSS feed error: the arcs of `rss` drawn smaller, with an exclamation badge in the secondary tone in the lower right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rss-error",
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
    ".....#...o",
    ".oo..#...o",
    ".oo..#...o",
    "",
    ".........o",
  ],
};

export default icon;
